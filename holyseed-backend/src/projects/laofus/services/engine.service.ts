import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import {
  applyFill,
  computeBuyLocLegs,
  computeIndicators,
  computeSellLocLegs,
  decide,
  round2,
  round4,
  Decision,
  ImuState,
} from '../core/engine';
import { UsMarketCalendar } from '../core/marketTime';
import { LaofusEngineState } from '../entities/engine-state.entity';
import { LaofusCycle } from '../entities/cycle.entity';
import { LaofusTrade } from '../entities/trade.entity';
import { LaofusEvent } from '../entities/event.entity';
import { LaofusPendingOrder } from '../entities/pending-order.entity';
import { LaofusAccountSnapshot } from '../entities/account-snapshot.entity';

/** 회수/기록에 필요한 판단 컨텍스트 (BuyDecision | SellDecision 재구성용) */
type FillDecision = Extract<Decision, { action: 'BUY' } | { action: 'SELL' }>;

const SYMBOL = 'SOXL';

export interface RunOptions {
  live: boolean;
  force: boolean;
  injectedPrice: number | null;
}

function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

/**
 * 무매 엔진 — DB(laofus 스키마)가 유일한 상태 원장.
 * 계좌-DB 보유수량 불일치 또는 DB 오류 시 주문 없이 중단 (안전 우선).
 */
@Injectable()
export class LaofusEngineService {
  private readonly logger = new Logger('LaofusEngine');
  private running = false;

  get isRunning(): boolean {
    return this.running;
  }

  constructor(
    private readonly toss: TossClientService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(LaofusEngineState) private readonly stateRepo: Repository<LaofusEngineState>,
    @InjectRepository(LaofusCycle) private readonly cycleRepo: Repository<LaofusCycle>,
    @InjectRepository(LaofusTrade) private readonly tradeRepo: Repository<LaofusTrade>,
    @InjectRepository(LaofusEvent) private readonly eventRepo: Repository<LaofusEvent>,
    @InjectRepository(LaofusPendingOrder) private readonly pendingRepo: Repository<LaofusPendingOrder>,
    @InjectRepository(LaofusAccountSnapshot) private readonly snapshotRepo: Repository<LaofusAccountSnapshot>,
  ) {}

  async logSchedulerEvent(level: 'info' | 'warn' | 'error', message: string): Promise<void> {
    await this.event(level, message);
  }

  private async event(level: 'info' | 'warn' | 'error', message: string, runId: string | null = null): Promise<void> {
    this.logger.log(`[${level}] ${message}`);
    try {
      await this.eventRepo.save(this.eventRepo.create({ level, source: 'engine', message, runId }));
    } catch (e) {
      this.logger.error(`이벤트 기록 실패: ${e}`);
    }
  }

  private async waitForFill(orderId: string, timeoutMs = 45_000): Promise<TossOrder | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const order = await this.toss.getOrder(orderId);
      if (order.status === 'FILLED') return order;
      if (['CANCELED', 'REJECTED'].includes(order.status)) {
        throw new Error(`주문 ${order.status}: ${orderId}`);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    return null;
  }

  private async recordFill(
    decisionIn: FillDecision,
    filled: TossOrder,
    runId: string | null,
    pendingId: number | null,
  ): Promise<string> {
    const row = await this.stateRepo.findOne({ where: { symbol: SYMBOL } });
    if (!row) throw new Error('engine_state 행 없음 — 체결 반영 불가');
    const s: ImuState = {
      cycle: row.cycleNo,
      T: Number(row.t),
      quantity: Number(row.quantity),
      avgPrice: Number(row.avgPrice),
      cash: Number(row.cash),
      principal: Number(row.principal),
    };

    let tAfter = decisionIn.tAfter;
    if (decisionIn.action === 'BUY' && (decisionIn.kind === '전액' || decisionIn.kind === '절반')) {
      tAfter = round4(s.T + (decisionIn.kind === '절반' ? 0.5 : 1));
    } else if (decisionIn.action === 'SELL' && decisionIn.kind === '쿼터매도') {
      tAfter = round4(s.T * 0.75);
    }
    const d: FillDecision = tAfter === decisionIn.tAfter ? decisionIn : { ...decisionIn, tAfter };

    const fq = Number(filled.execution.filledQuantity);
    const fp = Number(filled.execution.averageFilledPrice);
    const fa = Number(filled.execution.filledAmount);

    const next = applyFill(s, d, { quantity: fq, price: fp, amount: fa });
    const cycleClosed = d.action === 'SELL' && next.quantity === 0;

    const cycle = await this.cycleRepo.findOne({ where: { symbol: SYMBOL, cycleNo: s.cycle } });
    if (!cycle) throw new Error(`cycle ${s.cycle} 행 없음 — 데이터 정합성 오류`);
    const lastSeq = await this.tradeRepo
      .createQueryBuilder('t')
      .select('MAX(t.seq)', 'max')
      .where('t.cycle_id = :cid', { cid: cycle.id })
      .getRawOne<{ max: number | null }>();

    await this.dataSource.transaction(async (em) => {
      const trade = await em.getRepository(LaofusTrade).save({
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
        orderId: filled.orderId,
      });
      await em.getRepository(LaofusEngineState).update(
        { symbol: SYMBOL },
        {
          t: String(next.T),
          quantity: String(next.quantity),
          avgPrice: String(next.avgPrice),
          cash: String(next.cash),
          cycleDone: cycleClosed,
        },
      );
      if (pendingId !== null) {
        await em
          .getRepository(LaofusPendingOrder)
          .update({ id: pendingId }, { status: 'APPLIED', appliedTradeId: trade.id });
      }
      if (cycleClosed) {
        const sums = await em
          .getRepository(LaofusTrade)
          .createQueryBuilder('t')
          .select('t.side', 'side')
          .addSelect('SUM(t.amount)', 'sum')
          .where('t.cycle_id = :cid', { cid: cycle.id })
          .groupBy('t.side')
          .getRawMany<{ side: string; sum: string }>();
        const buySum = Number(sums.find((x) => x.side === 'BUY')?.sum ?? 0);
        const sellSum = Number(sums.find((x) => x.side === 'SELL')?.sum ?? 0);
        const profit = Math.round((sellSum - buySum) * 100) / 100;
        await em.getRepository(LaofusCycle).update(
          { id: cycle.id },
          {
            endDate: kstDate(),
            profit: String(profit),
            profitPct: String(Math.round((profit / Number(cycle.principal)) * 1e4) / 1e4),
          },
        );
      }
    });

    const desc =
      d.action === 'BUY'
        ? `매수(${d.kind}) $${d.amountUsd} → T ${s.T} → ${next.T}`
        : `매도(${d.kind}) ${d.quantity}주 → T ${s.T} → ${next.T}`;
    const summary =
      `체결 완료: ${desc} | ${fq}주 @ $${fp} = $${fa} | 이후 T=${next.T}, 보유=${next.quantity}, 평단=$${next.avgPrice}, 잔금=$${next.cash}` +
      (cycleClosed ? ' | 사이클 종료 — 다음 시작은 수동 확인' : '');
    await this.event('info', summary, runId);
    return summary;
  }

  private toDecision(p: LaofusPendingOrder): FillDecision {
    return p.side === 'BUY'
      ? {
          action: 'BUY',
          amountUsd: Number(p.requestAmount),
          kind: p.kind as '전액' | '절반' | '사이클시작',
          tAfter: Number(p.tAfter),
        }
      : {
          action: 'SELL',
          quantity: Number(p.requestQuantity),
          kind: p.kind as '쿼터매도' | '전량매도',
          tAfter: Number(p.tAfter),
        };
  }

  private async reconcile(runId: string | null, log: (m: string) => void): Promise<number> {
    const pendings = await this.pendingRepo.find({ where: { status: 'PENDING' }, order: { id: 'ASC' } });
    let remaining = 0;
    for (const p of pendings) {
      try {
        const order = await this.toss.getOrder(p.orderId);
        const partialQty = Number(order.execution.filledQuantity);
        if (order.status === 'FILLED') {
          const summary = await this.recordFill(this.toDecision(p), order, runId, p.id);
          log(`회수 반영: ${summary}`);
        } else if (['CANCELED', 'REJECTED'].includes(order.status)) {
          if (partialQty > 0) {
            const summary = await this.recordFill(this.toDecision(p), order, runId, p.id);
            await this.event('warn', `주문 ${order.status}(부분 체결 반영): ${p.orderId} — ${summary}`, runId);
          } else {
            await this.pendingRepo.update({ id: p.id }, { status: 'FAILED' });
            await this.event('error', `주문 ${order.status} — 미체결 종료: ${p.kind} (${p.orderId})`, runId);
          }
        } else {
          remaining++;
          log(`체결 대기 중: ${p.kind} ${p.side} (${order.status}, 주문 ${p.orderId.slice(0, 12)}…)`);
        }
      } catch (e) {
        remaining++;
        await this.event('error', `회수 조회 실패: ${p.orderId} — ${e instanceof Error ? e.message : e}`, runId);
      }
    }
    return remaining;
  }

  async reconcileOnly(): Promise<string[]> {
    if (this.running) return ['이미 실행 중 — 동시 실행 불가'];
    this.running = true;
    const runId = randomUUID();
    const lines: string[] = [];
    const log = (m: string) => {
      lines.push(m);
      this.logger.log(m);
    };
    try {
      const hasPending = await this.pendingRepo.exists({ where: { status: 'PENDING' } });
      if (!hasPending) {
        log('회수 대상 없음');
        return lines;
      }
      await this.event('info', '=== 체결 회수 실행 ===', runId);
      const remaining = await this.reconcile(runId, log);
      if (remaining > 0) await this.event('info', `회수 후에도 대기 ${remaining}건 — 다음 실행에서 재시도`, runId);
      return lines;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.event('error', `회수 오류: ${msg}`, runId);
      lines.push(`오류: ${msg}`);
      return lines;
    } finally {
      this.running = false;
    }
  }

  async run(opts: RunOptions): Promise<string[]> {
    if (this.running) return ['이미 실행 중 — 동시 실행 불가'];
    this.running = true;
    const runId = randomUUID();
    const lines: string[] = [];
    const log = (m: string) => {
      lines.push(m);
      this.logger.log(m);
    };
    try {
      const header = `=== 엔진 실행 (${opts.live ? 'LIVE' : 'dry-run'}${opts.force ? ', force' : ''}) ===`;
      lines.push(header);
      await this.event('info', header, runId);

      const remainingPending = await this.reconcile(runId, log);

      const row = await this.stateRepo.findOne({ where: { symbol: SYMBOL } });
      if (!row) {
        await this.event(
          'error',
          'engine_state 행 없음 — 시딩 필요 (yarn workspace @holyseed/backend laofus:seed)',
          runId,
        );
        lines.push('오류: engine_state 없음');
        return lines;
      }

      if (row.cycleDone) {
        await this.event('warn', '사이클 종료 상태 — 다음 사이클 시작(복리 여부)은 수동 확인 필요', runId);
        lines.push('사이클 종료 상태 — 종료');
        return lines;
      }
      const s: ImuState = {
        cycle: row.cycleNo,
        T: Number(row.t),
        quantity: Number(row.quantity),
        avgPrice: Number(row.avgPrice),
        cash: Number(row.cash),
        principal: Number(row.principal),
      };
      const ind = computeIndicators(s);
      log(
        `상태: T=${s.T}, 보유=${s.quantity}, 평단=$${s.avgPrice}, 잔금=$${s.cash} | ` +
          `별지점=$${ind.starPrice}, 1회매수금=$${ind.oneBuyAmount}, 전량매도가=$${ind.fullSellPrice}`,
      );

      if (s.T === 0 || s.quantity <= 0) {
        return await this.runCycleStart(s, opts, runId, log, lines, remainingPending);
      }

      const holding = await this.toss.getHolding(SYMBOL);
      const actualQty = holding ? Number(holding.quantity) : 0;
      if (Math.abs(actualQty - s.quantity) > 0.0001) {
        await this.event(
          'error',
          `계좌 보유수량(${actualQty})과 DB 상태(${s.quantity}) 불일치 — 주문 중단, 수동 확인 필요`,
          runId,
        );
        lines.push('오류: 보유수량 불일치');
        return lines;
      }

      const cal = (await this.toss.getUsMarketCalendar()) as UsMarketCalendar;
      const buyUsDate = cal.today.regularMarket ? cal.today.date : null;

      if (!opts.live) {
        for (const leg of computeBuyLocLegs(s)) {
          log(`[dry] LOC 매수 예정: ${leg.quantity}주 @ $${leg.price} (${leg.halfStep ? '절반' : '전액'} 단위)`);
        }
        for (const leg of computeSellLocLegs(s)) {
          log(`[dry] LOC 매도 예정: ${leg.quantity}주 @ $${leg.price} (${leg.kind})`);
        }
        lines.push('dry-run — 주문 미실행');
        return lines;
      }

      // ── 매수
      if (!opts.force && !buyUsDate) {
        log('매수 스킵: 오늘은 미국 정규장 휴장일');
      } else if (!opts.force && row.lastBuyDecisionUsDate === buyUsDate) {
        log(`매수 스킵: 오늘(${buyUsDate}) 이미 LOC 매수를 접수함`);
      } else {
        const legs = computeBuyLocLegs(s);
        if (legs.length === 0) {
          log('매수 판단: 오늘 걸 LOC 없음 (리버스모드 대상이거나 1주도 안 됨)');
        } else if (remainingPending > 0) {
          await this.event('warn', `체결 대기 주문 ${remainingPending}건 미회수 — 매수 LOC 스킵`, runId);
          lines.push('매수 스킵 — 미회수 주문 존재');
        } else {
          const totalAmount = round2(legs.reduce((a, leg) => a + leg.quantity * leg.price, 0));
          const bp = Number(await this.toss.getBuyingPower('USD'));
          if (bp < totalAmount) {
            await this.event('error', `계좌 매수가능금액 $${bp} < 매수 LOC 합계 $${totalAmount} — 매수 스킵`, runId);
            lines.push('매수 스킵 — 매수가능금액 부족');
          } else {
            const usDate = buyUsDate ?? kstDate();
            const cycleRow = await this.cycleRepo.findOne({ where: { symbol: SYMBOL, cycleNo: s.cycle } });
            let legIdx = 0;
            for (const leg of legs) {
              legIdx += 1;
              const kind = leg.halfStep ? '절반' : '전액';
              const clientOrderId = `imu-${usDate.replaceAll('-', '')}-b${legIdx}`;
              const placed = await this.toss.buyLoc(SYMBOL, String(leg.quantity), String(leg.price), clientOrderId);
              log(`LOC 매수 접수: ${leg.quantity}주 @ $${leg.price} (${kind}) — ${placed.orderId}`);
              await this.pendingRepo.save({
                orderId: placed.orderId,
                clientOrderId,
                symbol: SYMBOL,
                side: 'BUY',
                kind,
                tBefore: String(s.T),
                tAfter: String(round4(s.T + (leg.halfStep ? 0.5 : 1))),
                requestAmount: String(round2(leg.quantity * leg.price)),
                requestQuantity: null,
                cycleId: cycleRow?.id ?? 0,
                status: 'PENDING',
              });
            }
            await this.stateRepo.update({ symbol: SYMBOL }, { lastBuyDecisionUsDate: usDate });
            await this.event(
              'info',
              `LOC 매수 ${legs.length}건 접수 — 마감 시점 자동 판정, 다음날 개장 후 회수`,
              runId,
            );
            lines.push(`LOC 매수 ${legs.length}건 접수`);
          }
        }
      }

      // ── 매도
      if (!opts.force && !buyUsDate) {
        log('매도 스킵: 오늘은 미국 정규장 휴장일');
      } else if (!opts.force && row.lastSellDecisionUsDate === buyUsDate) {
        log(`매도 스킵: 오늘(${buyUsDate}) 이미 LOC 매도를 접수함`);
      } else {
        const sellLegs = computeSellLocLegs(s);
        if (sellLegs.length === 0) {
          log('매도 판단: 오늘 걸 LOC 없음 (리버스모드 대상이거나 보유량 없음)');
        } else if (remainingPending > 0) {
          await this.event('warn', `체결 대기 주문 ${remainingPending}건 미회수 — 매도 LOC 스킵`, runId);
          lines.push('매도 스킵 — 미회수 주문 존재');
        } else {
          const usDate = buyUsDate ?? kstDate();
          const cycleRow = await this.cycleRepo.findOne({ where: { symbol: SYMBOL, cycleNo: s.cycle } });
          let legIdx = 0;
          for (const leg of sellLegs) {
            legIdx += 1;
            const clientOrderId = `imu-${usDate.replaceAll('-', '')}-s${legIdx}`;
            const isFinalSell = leg.kind === '전량매도';
            const placed = isFinalSell
              ? await this.toss.sellByLimit(SYMBOL, String(leg.quantity), String(leg.price), clientOrderId)
              : await this.toss.sellLoc(SYMBOL, String(leg.quantity), String(leg.price), clientOrderId);
            log(
              `${isFinalSell ? '지정가' : 'LOC'} 매도 접수: ${leg.quantity}주 @ $${leg.price} (${leg.kind}) — ${placed.orderId}`,
            );
            await this.pendingRepo.save({
              orderId: placed.orderId,
              clientOrderId,
              symbol: SYMBOL,
              side: 'SELL',
              kind: leg.kind,
              tBefore: String(s.T),
              tAfter: String(leg.kind === '쿼터매도' ? round4(s.T * 0.75) : 0),
              requestAmount: null,
              requestQuantity: String(leg.quantity),
              cycleId: cycleRow?.id ?? 0,
              status: 'PENDING',
            });
          }
          await this.stateRepo.update({ symbol: SYMBOL }, { lastSellDecisionUsDate: usDate });
          await this.event(
            'info',
            `LOC 매도 ${sellLegs.length}건 접수 — 마감 시점 자동 판정, 다음날 개장 후 회수`,
            runId,
          );
          lines.push(`LOC 매도 ${sellLegs.length}건 접수`);
        }
      }

      return lines;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.event('error', `엔진 오류: ${msg}`, runId);
      lines.push(`오류: ${msg}`);
      return lines;
    } finally {
      this.running = false;
    }
  }

  /** 사이클 시작(T=0) 전용 — 현재가 즉시판단 + MARKET 주문 (레거시 경로, 온주 LOC 전환 대상 아님) */
  private async runCycleStart(
    s: ImuState,
    opts: RunOptions,
    runId: string | null,
    log: (m: string) => void,
    lines: string[],
    remainingPending: number,
  ): Promise<string[]> {
    const price =
      opts.injectedPrice !== null && !opts.live
        ? opts.injectedPrice
        : Number((await this.toss.getPrice(SYMBOL)).lastPrice);
    const d: Decision = decide(s, price);
    if (d.action === 'NONE') {
      await this.event('info', `판단: 주문 없음 — ${d.reason} (현재가 $${price})`, runId);
      lines.push(`판단: 주문 없음 — ${d.reason}`);
      return lines;
    }
    const desc =
      d.action === 'BUY' ? `매수(${d.kind}) $${d.amountUsd} → T ${s.T} → ${d.tAfter}` : `매도 → T ${s.T} → ${d.tAfter}`;
    log(`판단: ${desc}`);

    if (!opts.live) {
      await this.event('info', `[dry] 판단: ${desc} (현재가 $${price}) — 주문 미실행`, runId);
      lines.push('dry-run — 주문 미실행');
      return lines;
    }
    if (remainingPending > 0) {
      await this.event('warn', `체결 대기 주문 ${remainingPending}건 미회수 — 신규 주문 스킵 (판단: ${desc})`, runId);
      lines.push('신규 주문 스킵 — 미회수 주문 존재');
      return lines;
    }
    if (d.action === 'BUY') {
      const bp = Number(await this.toss.getBuyingPower('USD'));
      if (bp < d.amountUsd) {
        await this.event('error', `계좌 매수가능금액 $${bp} < 주문금액 $${d.amountUsd} — 주문 중단`, runId);
        lines.push('오류: 매수가능금액 부족');
        return lines;
      }
    }
    const clientOrderId = `imu-${kstDate().replaceAll('-', '')}-${d.action === 'BUY' ? 'b' : 's'}`;
    const placed =
      d.action === 'BUY'
        ? await this.toss.buyByAmount(SYMBOL, String(d.amountUsd), clientOrderId)
        : await this.toss.sellByQuantity(
            SYMBOL,
            String((d as Extract<Decision, { action: 'SELL' }>).quantity),
            clientOrderId,
          );
    log(`주문 접수: ${placed.orderId}`);

    const cycleRow = await this.cycleRepo.findOne({ where: { symbol: SYMBOL, cycleNo: s.cycle } });
    const pending = await this.pendingRepo.save({
      orderId: placed.orderId,
      clientOrderId,
      symbol: SYMBOL,
      side: d.action,
      kind: d.kind,
      tBefore: String(s.T),
      tAfter: String(d.tAfter),
      requestAmount: d.action === 'BUY' ? String(d.amountUsd) : null,
      requestQuantity: d.action === 'SELL' ? String((d as Extract<Decision, { action: 'SELL' }>).quantity) : null,
      cycleId: cycleRow?.id ?? 0,
      status: 'PENDING',
    });

    const filled = await this.waitForFill(placed.orderId);
    if (filled) {
      const summary = await this.recordFill(d, filled, runId, pending.id);
      lines.push(summary);
      return lines;
    }
    await this.event(
      'info',
      `주문 접수 완료(개장 체결 대기): ${desc} — 다음 세션 개장 후 자동 회수 (주문 ${placed.orderId.slice(0, 12)}…)`,
      runId,
    );
    lines.push('개장 체결 대기 — 회수 예약됨');
    return lines;
  }

  async captureAccountSnapshot(): Promise<LaofusAccountSnapshot> {
    const [holdings, bpUsd, bpKrw, fx] = await Promise.all([
      this.toss.getHoldingsAll(),
      this.toss.getBuyingPower('USD'),
      this.toss.getBuyingPower('KRW'),
      this.toss.getExchangeRate(),
    ]);
    const rate = Number(fx.rate);
    const stockValueUsd = holdings.items.reduce((sum, h) => sum + Number(h.marketValue.amount), 0);
    const cashUsd = Number(bpUsd);
    const cashKrw = Number(bpKrw);
    const totalValueUsd = stockValueUsd + cashUsd;
    const totalValueKrw = totalValueUsd * rate + cashKrw;
    const holdingsJson = holdings.items.map((h) => ({
      symbol: h.symbol,
      quantity: Number(h.quantity),
      marketValueUsd: Number(h.marketValue.amount),
    }));

    const date = kstDate();
    const existing = await this.snapshotRepo.findOne({ where: { date } });
    return this.snapshotRepo.save({
      ...(existing ?? {}),
      date,
      totalValueUsd: String(Math.round(totalValueUsd * 100) / 100),
      totalValueKrw: String(Math.round(totalValueKrw * 100) / 100),
      stockValueUsd: String(Math.round(stockValueUsd * 100) / 100),
      cashUsd: String(cashUsd),
      cashKrw: String(cashKrw),
      fxRate: String(rate),
      holdingsJson,
    });
  }
}
