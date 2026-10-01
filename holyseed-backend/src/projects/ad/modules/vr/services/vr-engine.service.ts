import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import { VrService } from '../vr.service';
import { VrEvent } from '../entities/vr-event.entity';
import { VrPendingOrder } from '../entities/vr-pending-order.entity';
import { VrFillKind } from '../entities';
import { decide, activeSession, tradingWindowOpen, planLadder, missingRungs, marketableQty } from '../core';
import type { OpenOrderLite, LadderRung } from '../core';
import type { UsMarketCalendar, MarketSession } from '../core';

const SYMBOL = 'TQQQ';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface VrRunOptions {
  live: boolean;
  force: boolean;
}

function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

/** 크론이 1시간마다 여러 번 도는 VR 특성상 clientOrderId에 시각(HHmm)까지 포함 (laofus는 하루 최대 2회라 날짜만 씀) */
function kstHHmm(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}${m}`;
}

/**
 * VR(TQQQ 밸류 리밸런싱) 엔진 — 5분 틱마다 ①회수(체결 반영) ②예약주문 계단 보충 ③안전장치 순서로 돈다.
 *
 * ② 예약주문 계단: 트레이딩 데이(KST 09:00~다음날 08:50) 동안 매수·매도 각 VR_LADDER_STEPS(기본 3)단계를
 *    "1주씩 지정가 DAY"로 걸어두고, 체결돼서 부족해진 단계만 다음 틱에 채운다 (core/ladder-plan.ts).
 *    → 5분 사이의 급등락도 지정가가 잡고, 하루 시작(09:00 첫 틱)에 전날 만료분이 자동으로 다시 걸린다.
 * ③ 안전장치(VR_SAFETYNET=false로 끔): 급락·급등이 계단 범위를 넘어 decide()가 계단 물량보다 더 사거나
 *    팔라고 하면, 모자란 만큼만 기존처럼 시장가(연장시간은 marketable 지정가)로 즉시 주문.
 *
 * DB(ad 스키마 vr_* 테이블)가 유일한 상태 원장. 계좌-DB 보유수량 불일치 또는 DB 오류 시 주문 없이 중단.
 */
@Injectable()
export class VrEngineService {
  private readonly logger = new Logger('VrEngine');
  private running = false;

  get isRunning(): boolean {
    return this.running;
  }

  constructor(
    private readonly toss: TossClientService,
    private readonly vrService: VrService,
    @InjectRepository(VrEvent) private readonly eventRepo: Repository<VrEvent>,
    @InjectRepository(VrPendingOrder) private readonly pendingRepo: Repository<VrPendingOrder>,
  ) {}

  private async event(level: 'info' | 'warn' | 'error', message: string, runId: string | null = null): Promise<void> {
    this.logger.log(`[${level}] ${message}`);
    try {
      await this.eventRepo.save(this.eventRepo.create({ level, source: 'engine', message, runId }));
    } catch (e) {
      this.logger.error(`이벤트 기록 실패: ${e}`);
    }
  }

  /** 스케줄러 등 엔진 외부에서 발생한 이벤트(예: 비활성 스킵)를 동일한 vr_events 원장에 기록 */
  async logSchedulerEvent(level: 'info' | 'warn' | 'error', message: string): Promise<void> {
    await this.event(level, message);
  }

  /**
   * 미회수 주문 처리 — 체결됐으면 DB 반영, 취소/거부면 FAILED. @returns 여전히 대기 중인 주문 수
   * 주문이 여러 건이라 건별 조회 대신 종료 주문 목록을 한 번에 가져온다(건별 조회는 토스 요청 한도 429에 걸림).
   * 체결은 체결 시각 순으로 반영해야 평단/Pool 스냅샷이 실제 순서와 맞는다.
   */
  private async reconcile(runId: string | null, openOrders: TossOrder[]): Promise<number> {
    const pendings = await this.pendingRepo.find({ where: { status: 'PENDING' }, order: { id: 'ASC' } });
    if (pendings.length === 0) return 0;

    let closed: Map<string, TossOrder>;
    try {
      const res = await this.toss.getOrders('CLOSED', { symbol: SYMBOL, limit: 100 });
      closed = new Map(res.orders.map((o) => [o.orderId, o]));
    } catch (e) {
      await this.event('error', `회수 조회 실패(종료 주문 목록): ${e instanceof Error ? e.message : e}`, runId);
      return pendings.length;
    }
    const openIds = new Set(openOrders.map((o) => o.orderId));

    const resolved: { p: VrPendingOrder; order: TossOrder }[] = [];
    let remaining = 0;
    for (const p of pendings) {
      let order = closed.get(p.orderId);
      if (!order) {
        if (openIds.has(p.orderId)) {
          remaining++;
          continue;
        }
        // 목록 어디에도 없으면(limit 밖 등) 단건 조회로 확인
        try {
          order = await this.toss.getOrder(p.orderId);
          await sleep(300);
        } catch (e) {
          remaining++;
          await this.event('error', `회수 조회 실패: ${p.orderId} — ${e instanceof Error ? e.message : e}`, runId);
          continue;
        }
      }
      if (order.status === 'FILLED' || ['CANCELED', 'REJECTED'].includes(order.status)) resolved.push({ p, order });
      else remaining++;
    }

    resolved.sort((a, b) => (a.order.execution.filledAt ?? '').localeCompare(b.order.execution.filledAt ?? ''));
    for (const { p, order } of resolved) {
      const filledQty = Number(order.execution.filledQuantity);
      if (filledQty > 0) {
        const fill = await this.vrService.createFill({
          fillDate: kstDate(order.execution.filledAt ? new Date(order.execution.filledAt) : new Date()),
          kind: p.side === 'BUY' ? VrFillKind.BUY : VrFillKind.SELL,
          price: Number(order.execution.averageFilledPrice),
          quantity: filledQty,
          note: order.status === 'FILLED' ? '엔진 자동매매 (회수)' : '엔진 자동매매 (부분체결 후 취소, 회수)',
        });
        await this.pendingRepo.update({ id: p.id }, { status: 'APPLIED', appliedFillId: fill.id });
        await this.event(
          order.status === 'FILLED' ? 'info' : 'warn',
          `회수 반영: ${p.side} ${filledQty}주 @ $${order.execution.averageFilledPrice}` +
            (order.status === 'FILLED' ? '' : ` (${order.status}, 부분 체결)`),
          runId,
        );
      } else {
        await this.pendingRepo.update({ id: p.id }, { status: 'FAILED' });
        // DAY 예약주문이 하루 끝에 만료(CANCELED)되는 건 정상 — 에러가 아니라 info
        await this.event(
          order.status === 'CANCELED' ? 'info' : 'error',
          `주문 ${order.status} — 미체결 종료: ${p.side} ${p.requestQuantity}주 (${p.clientOrderId})`,
          runId,
        );
      }
    }
    return remaining;
  }

  /** 접수한 주문을 원장에 기록 — 미체결이어도 다음 틱이 회수 */
  private async recordPending(
    placed: TossOrder,
    clientOrderId: string,
    side: 'BUY' | 'SELL',
    qty: number,
    cycleNo: number,
  ) {
    return this.pendingRepo.save(
      this.pendingRepo.create({
        orderId: placed.orderId,
        clientOrderId,
        symbol: SYMBOL,
        side,
        requestQuantity: qty,
        cycleNo,
        status: 'PENDING',
      }),
    );
  }

  /** 실행 로그를 반환 (수동 실행 시 스트림 대신 결과 문자열) */
  async run(opts: VrRunOptions): Promise<string[]> {
    if (this.running) return ['이미 실행 중 — 동시 실행 불가'];
    this.running = true;
    const runId = randomUUID();
    const lines: string[] = [];
    const log = (m: string) => {
      lines.push(m);
      this.logger.log(m);
    };
    try {
      const header = `=== VR 엔진 실행 (${opts.live ? 'LIVE' : 'dry-run'}${opts.force ? ', force' : ''}) ===`;
      lines.push(header);
      await this.event('info', header, runId);

      // 열린 주문은 한 번만 조회해서 회수·계단 보충·안전장치가 같이 쓴다
      let openOrders: TossOrder[];
      try {
        openOrders = (await this.toss.getOrders('OPEN', { symbol: SYMBOL })).orders;
      } catch (e) {
        await this.event('error', `열린 주문 조회 실패 — 이번 틱 스킵: ${e instanceof Error ? e.message : e}`, runId);
        lines.push('오류: 열린 주문 조회 실패');
        return lines;
      }

      // 미회수 주문(체결 반영) 먼저 처리
      const remainingPending = await this.reconcile(runId, openOrders);

      // 세션/트레이딩 데이 판단 — force면 항상 열린 것으로 간주(수동 테스트용)
      let session: MarketSession = 'REGULAR';
      let windowOpen = true;
      if (!opts.force) {
        const cal = (await this.toss.getUsMarketCalendar()) as UsMarketCalendar;
        session = activeSession(cal);
        windowOpen = tradingWindowOpen(cal);
        if (!session && !windowOpen) {
          await this.event('info', '스킵: 활성 세션 없음 (휴장/장외)', runId);
          lines.push('스킵: 활성 세션 없음');
          return lines;
        }
        log(`세션: ${session ?? '주간거래/대기'} (예약창 ${windowOpen ? '열림' : '닫힘'})`);
      }

      // 상태 로드
      const settings = await this.vrService.getSettings();
      const state = await this.vrService.getState();
      if (!state.cycle) {
        await this.event('error', '진행 중인 사이클이 없습니다 — 사이클 등록 필요', runId);
        lines.push('오류: 진행 중인 사이클 없음');
        return lines;
      }

      // 계좌-DB 정합성
      const holding = await this.toss.getHolding(SYMBOL);
      const actualQty = holding ? Number(holding.quantity) : 0;
      if (Math.abs(actualQty - state.quantity) > 0.0001) {
        await this.event(
          'error',
          `계좌 보유수량(${actualQty})과 DB 상태(${state.quantity}) 불일치 — 주문 중단, 수동 확인 필요`,
          runId,
        );
        lines.push('오류: 보유수량 불일치');
        return lines;
      }

      // 시세
      const price = Number((await this.toss.getPrice(SYMBOL)).lastPrice);
      log(
        `상태: 보유=${state.quantity}, 평단=$${state.avgPrice}, Pool=$${state.pool} | ` +
          `최소밴드=$${state.minBand}, 최대밴드=$${state.maxBand} | 현재가=$${price} | 대기 주문 ${remainingPending}건`,
      );

      const cycleNo = state.cycle.cycleNo;
      const open: OpenOrderLite[] = openOrders
        .map((o) => ({
          side: o.side,
          price: Number(o.price ?? 0),
          quantity: Number(o.quantity) - Number(o.execution?.filledQuantity ?? 0),
        }))
        .filter((o) => o.price > 0 && o.quantity > 0);
      const placedNow: OpenOrderLite[] = [];
      let acted = false;

      // ── ② 예약주문 계단 보충
      if (windowOpen) {
        const steps = Number(process.env.VR_LADDER_STEPS ?? 3);
        const plan = planLadder({
          quantity: state.quantity,
          minBand: state.minBand,
          maxBand: state.maxBand,
          pool: state.pool,
          cyclePoolStart: state.cycle.poolStart,
          poolLimitPct: settings.poolLimitPct,
          steps,
        });
        const missing: LadderRung[] = [...missingRungs(plan.buys, open), ...missingRungs(plan.sells, open)];
        const fmt = (rs: LadderRung[]) => rs.map((r) => `$${r.price.toFixed(2)}`).join(' / ') || '없음';
        log(`계단 계획(${steps}단계): 매수 ${fmt(plan.buys)} | 매도 ${fmt(plan.sells)}`);

        if (missing.length > 0) {
          const desc = missing
            .map((r) => `${r.side === 'BUY' ? '매수' : '매도'} 1주 @ $${r.price.toFixed(2)}`)
            .join(', ');
          if (!opts.live) {
            await this.event('info', `[dry] 계단 신규 ${missing.length}건 예정: ${desc}`, runId);
            lines.push(`dry-run — 계단 신규 ${missing.length}건 미실행: ${desc}`);
          } else {
            let bp = Number(await this.toss.getBuyingPower('USD'));
            for (const rung of missing) {
              try {
                if (rung.side === 'BUY' && bp < rung.price) {
                  await this.event('warn', `계단 매수 $${rung.price} 스킵 — 매수가능금액 $${bp} 부족`, runId);
                  continue;
                }
                const cid = `vr-l-${kstDate()}-${kstHHmm()}-${rung.side === 'BUY' ? 'b' : 's'}${rung.prevQty}`;
                const limit = rung.price.toFixed(2);
                const placed =
                  rung.side === 'BUY'
                    ? await this.toss.buyByLimit(SYMBOL, '1', limit, cid)
                    : await this.toss.sellByLimit(SYMBOL, '1', limit, cid);
                await this.recordPending(placed, cid, rung.side, 1, cycleNo);
                placedNow.push({ side: rung.side, price: rung.price, quantity: 1 });
                if (rung.side === 'BUY') bp -= rung.price;
                acted = true;
                log(`계단 주문 접수: ${rung.side === 'BUY' ? '매수' : '매도'} 1주 @ $${limit} — ${placed.orderId}`);
                await sleep(300);
              } catch (e) {
                await this.event(
                  'warn',
                  `계단 주문 실패 ${rung.side} @ $${rung.price}: ${e instanceof Error ? e.message : e}`,
                  runId,
                );
              }
            }
            if (acted) await this.event('info', `계단 신규 ${placedNow.length}건 접수: ${desc}`, runId);
          }
        }
      }

      // ── ③ 안전장치: 계단 범위를 넘는 급락·급등만 기존 방식(즉시 주문)으로 보충
      if (session && process.env.VR_SAFETYNET !== 'false') {
        const decision = decide(
          { quantity: state.quantity, vValue: state.vValue, pool: state.pool, cyclePoolStart: state.cycle.poolStart },
          price,
          { bandPct: settings.bandPct, poolLimitPct: settings.poolLimitPct },
        );
        if (decision.action !== 'NONE') {
          const coverage = marketableQty([...open, ...placedNow], decision.action, price);
          const shortfall = decision.quantity - coverage;
          const desc = `${decision.action === 'BUY' ? '매수' : '매도'} ${shortfall}주 @ 약 $${price} (판단 ${decision.quantity}주 − 계단 체결 대기 ${coverage}주)`;
          if (shortfall < 1) {
            log(
              `안전장치: 계단 주문이 이미 체결 대기 중이라 추가 주문 불필요 (판단 ${decision.quantity}주, 대기 ${coverage}주)`,
            );
          } else if (!opts.live) {
            await this.event('info', `[dry] 안전장치 판단: ${desc} — 미실행`, runId);
            lines.push(`dry-run — 안전장치 ${desc} 미실행`);
          } else {
            if (decision.action === 'BUY') {
              const bp = Number(await this.toss.getBuyingPower('USD'));
              if (bp < shortfall * price) {
                await this.event(
                  'error',
                  `계좌 매수가능금액 $${bp} < 예상금액 $${(shortfall * price).toFixed(2)} — 안전장치 주문 중단`,
                  runId,
                );
                lines.push('오류: 매수가능금액 부족');
                return lines;
              }
            }
            const cid = `vr-${kstDate()}-${kstHHmm()}-${decision.action === 'BUY' ? 'b' : 's'}`;
            const bufferPct = Number(process.env.VR_EXTENDED_LIMIT_BUFFER_PCT ?? 0.3) / 100;
            const qty = String(shortfall);
            let placed: TossOrder;
            if (session === 'REGULAR') {
              placed =
                decision.action === 'BUY'
                  ? await this.toss.buyByQuantity(SYMBOL, qty, cid)
                  : await this.toss.sellByQuantityMarket(SYMBOL, qty, cid);
            } else {
              // 프리/애프터마켓 — marketable limit (현재가 대비 버퍼만큼 유리하게 걸어 사실상 즉시체결 유도)
              const limitPrice =
                decision.action === 'BUY' ? (price * (1 + bufferPct)).toFixed(2) : (price * (1 - bufferPct)).toFixed(2);
              placed =
                decision.action === 'BUY'
                  ? await this.toss.buyByLimit(SYMBOL, qty, limitPrice, cid)
                  : await this.toss.sellByLimit(SYMBOL, qty, limitPrice, cid);
              log(`지정가 주문(${session}): 버퍼 ${(bufferPct * 100).toFixed(2)}% → $${limitPrice}`);
            }
            await this.recordPending(placed, cid, decision.action, shortfall, cycleNo);
            acted = true;
            await this.event(
              'info',
              `안전장치 주문 접수(체결 대기, 다음 틱에 회수): ${desc} — ${placed.orderId.slice(0, 12)}…`,
              runId,
            );
            lines.push(`안전장치 주문 접수: ${desc}`);
          }
        }
      }

      if (!acted) {
        const msg = `주문 없음 — 계단 ${open.length}건 유지 중 (현재가 $${price})`;
        await this.event('info', `판단: ${msg}`, runId);
        lines.push(`판단: ${msg}`);
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
}
