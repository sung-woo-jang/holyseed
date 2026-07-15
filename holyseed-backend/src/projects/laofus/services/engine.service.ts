import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { TossClientService, TossOrder } from './toss-client.service'
import { applyFill, computeIndicators, decide, Decision, ImuState } from '../core/engine'
import { checkWindow, UsMarketCalendar } from '../core/marketTime'
import { LaofusEngineState } from '../entities/engine-state.entity'
import { LaofusCycle } from '../entities/cycle.entity'
import { LaofusTrade } from '../entities/trade.entity'
import { LaofusEvent } from '../entities/event.entity'

const SYMBOL = 'SOXL'

export interface RunOptions {
  live: boolean
  force: boolean
  injectedPrice: number | null
}

function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d)
}

/**
 * 무매 엔진 — DB(laofus 스키마)가 유일한 상태 원장.
 * 계좌-DB 보유수량 불일치 또는 DB 오류 시 주문 없이 중단 (안전 우선).
 */
@Injectable()
export class LaofusEngineService {
  private readonly logger = new Logger('LaofusEngine')
  private running = false

  get isRunning(): boolean {
    return this.running
  }

  constructor(
    private readonly toss: TossClientService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(LaofusEngineState) private readonly stateRepo: Repository<LaofusEngineState>,
    @InjectRepository(LaofusCycle) private readonly cycleRepo: Repository<LaofusCycle>,
    @InjectRepository(LaofusTrade) private readonly tradeRepo: Repository<LaofusTrade>,
    @InjectRepository(LaofusEvent) private readonly eventRepo: Repository<LaofusEvent>
  ) {}

  private async event(
    level: 'info' | 'warn' | 'error',
    message: string,
    runId: string | null = null
  ): Promise<void> {
    this.logger.log(`[${level}] ${message}`)
    try {
      await this.eventRepo.save(this.eventRepo.create({ level, source: 'engine', message, runId }))
    } catch (e) {
      this.logger.error(`이벤트 기록 실패: ${e}`)
    }
  }

  private async waitForFill(orderId: string, timeoutMs = 120_000): Promise<TossOrder> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const order = await this.toss.getOrder(orderId)
      if (order.status === 'FILLED') return order
      if (['CANCELED', 'REJECTED'].includes(order.status)) {
        throw new Error(`주문 ${order.status}: ${orderId}`)
      }
      await new Promise((r) => setTimeout(r, 3000))
    }
    throw new Error(`체결 확인 타임아웃(${timeoutMs / 1000}s): ${orderId}`)
  }

  /** 실행 로그를 반환 (수동 실행 시 스트림 대신 결과 문자열) */
  async run(opts: RunOptions): Promise<string[]> {
    if (this.running) return ['이미 실행 중 — 동시 실행 불가']
    this.running = true
    const runId = randomUUID()
    const lines: string[] = []
    const log = (m: string) => {
      lines.push(m)
      this.logger.log(m)
    }
    try {
      const header = `=== 엔진 실행 (${opts.live ? 'LIVE' : 'dry-run'}${opts.force ? ', force' : ''}) ===`
      lines.push(header)
      await this.event('info', header, runId) // 실행 시작 마커 — 런 그룹 시작점 + SSE 즉시 푸시

      // 시간창 검증
      if (!opts.force) {
        const cal = (await this.toss.getUsMarketCalendar()) as UsMarketCalendar
        const win = checkWindow(cal)
        if (!win.ok) {
          await this.event('info', `스킵: ${win.reason}${opts.live ? ' (LIVE)' : ''}`, runId)
          lines.push(`스킵: ${win.reason}`)
          return lines
        }
        log(`시간창 OK: ${win.reason} (미국 거래일 ${win.usDate})`)
      }

      // 상태 로드
      const row = await this.stateRepo.findOne({ where: { symbol: SYMBOL } })
      if (!row) {
        await this.event('error', 'engine_state 행 없음 — 시딩 필요 (yarn workspace @holyseed/backend laofus:seed)', runId)
        lines.push('오류: engine_state 없음')
        return lines
      }
      if (row.cycleDone) {
        await this.event('warn', '사이클 종료 상태 — 다음 사이클 시작(복리 여부)은 수동 확인 필요', runId)
        lines.push('사이클 종료 상태 — 종료')
        return lines
      }
      const s: ImuState = {
        cycle: row.cycleNo,
        T: Number(row.t),
        quantity: Number(row.quantity),
        avgPrice: Number(row.avgPrice),
        cash: Number(row.cash),
        principal: Number(row.principal),
      }

      // 시세 + 정합성
      const price =
        opts.injectedPrice !== null && !opts.live
          ? opts.injectedPrice
          : Number((await this.toss.getPrice(SYMBOL)).lastPrice)
      const ind = computeIndicators(s)
      log(
        `상태: T=${s.T}, 보유=${s.quantity}, 평단=$${s.avgPrice}, 잔금=$${s.cash} | ` +
          `별지점=$${ind.starPrice}, 1회매수금=$${ind.oneBuyAmount}, 전량매도가=$${ind.fullSellPrice} | 현재가=$${price}`
      )

      const holding = await this.toss.getHolding(SYMBOL)
      const actualQty = holding ? Number(holding.quantity) : 0
      if (Math.abs(actualQty - s.quantity) > 0.0001) {
        await this.event(
          'error',
          `계좌 보유수량(${actualQty})과 DB 상태(${s.quantity}) 불일치 — 주문 중단, 수동 확인 필요`,
          runId
        )
        lines.push('오류: 보유수량 불일치')
        return lines
      }

      // 판단
      const d: Decision = decide(s, price)
      if (d.action === 'NONE') {
        await this.event('info', `판단: 주문 없음 — ${d.reason} (현재가 $${price})`, runId)
        lines.push(`판단: 주문 없음 — ${d.reason}`)
        return lines
      }
      const desc =
        d.action === 'BUY'
          ? `매수(${d.kind}) $${d.amountUsd} → T ${s.T} → ${d.tAfter}`
          : `매도(${d.kind}) ${d.quantity}주 → T ${s.T} → ${d.tAfter}`
      log(`판단: ${desc}`)

      if (!opts.live) {
        await this.event('info', `[dry] 판단: ${desc} (현재가 $${price}) — 주문 미실행`, runId)
        lines.push('dry-run — 주문 미실행')
        return lines
      }

      // 실주문
      if (d.action === 'BUY') {
        const bp = Number(await this.toss.getBuyingPower('USD'))
        if (bp < d.amountUsd) {
          await this.event('error', `계좌 매수가능금액 $${bp} < 주문금액 $${d.amountUsd} — 주문 중단`, runId)
          lines.push('오류: 매수가능금액 부족')
          return lines
        }
      }
      const clientOrderId = `imu-${kstDate().replaceAll('-', '')}-${d.action === 'BUY' ? 'b' : 's'}`
      const placed =
        d.action === 'BUY'
          ? await this.toss.buyByAmount(SYMBOL, String(d.amountUsd), clientOrderId)
          : await this.toss.sellByQuantity(SYMBOL, String(d.quantity), clientOrderId)
      log(`주문 접수: ${placed.orderId}`)

      const filled = await this.waitForFill(placed.orderId)
      const fq = Number(filled.execution.filledQuantity)
      const fp = Number(filled.execution.averageFilledPrice)
      const fa = Number(filled.execution.filledAmount)
      log(`체결: ${fq}주 @ $${fp} = $${fa}`)

      const next = applyFill(s, d, { quantity: fq, price: fp, amount: fa })
      const cycleClosed = d.action === 'SELL' && next.quantity === 0

      const cycle = await this.cycleRepo.findOne({ where: { symbol: SYMBOL, cycleNo: s.cycle } })
      if (!cycle) throw new Error(`cycle ${s.cycle} 행 없음 — 데이터 정합성 오류`)
      const lastSeq = await this.tradeRepo
        .createQueryBuilder('t')
        .select('MAX(t.seq)', 'max')
        .where('t.cycle_id = :cid', { cid: cycle.id })
        .getRawOne<{ max: number | null }>()

      await this.dataSource.transaction(async (em) => {
        await em.getRepository(LaofusTrade).save({
          cycleId: cycle.id,
          seq: (lastSeq?.max ?? 0) + 1,
          date: kstDate(),
          kind: d.kind,
          side: d.action,
          price: String(fp),
          quantity: String(fq),
          amount: String(fa),
          tBefore: String(s.T),
          tAfter: String(next.T),
          avgAfter: String(next.avgPrice),
          qtyAfter: String(next.quantity),
          cashAfter: String(next.cash),
          orderId: placed.orderId,
        })
        await em.getRepository(LaofusEngineState).update(
          { symbol: SYMBOL },
          {
            t: String(next.T),
            quantity: String(next.quantity),
            avgPrice: String(next.avgPrice),
            cash: String(next.cash),
            cycleDone: cycleClosed,
          }
        )
        if (cycleClosed) {
          const sums = await em
            .getRepository(LaofusTrade)
            .createQueryBuilder('t')
            .select('t.side', 'side')
            .addSelect('SUM(t.amount)', 'sum')
            .where('t.cycle_id = :cid', { cid: cycle.id })
            .groupBy('t.side')
            .getRawMany<{ side: string; sum: string }>()
          const buySum = Number(sums.find((x) => x.side === 'BUY')?.sum ?? 0)
          const sellSum = Number(sums.find((x) => x.side === 'SELL')?.sum ?? 0)
          const profit = Math.round((sellSum - buySum) * 100) / 100
          await em.getRepository(LaofusCycle).update(
            { id: cycle.id },
            {
              endDate: kstDate(),
              profit: String(profit),
              profitPct: String(Math.round((profit / Number(cycle.principal)) * 1e4) / 1e4),
            }
          )
        }
      })

      await this.event(
        'info',
        `체결 완료: ${desc} | ${fq}주 @ $${fp} = $${fa} | 이후 T=${next.T}, 보유=${next.quantity}, 평단=$${next.avgPrice}, 잔금=$${next.cash}` +
          (cycleClosed ? ' | 사이클 종료 — 다음 시작은 수동 확인' : ''),
        runId
      )
      lines.push(`체결 완료: T=${next.T}, 보유=${next.quantity}, 잔금=$${next.cash}`)
      return lines
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await this.event('error', `엔진 오류: ${msg}`, runId)
      lines.push(`오류: ${msg}`)
      return lines
    } finally {
      this.running = false
    }
  }
}
