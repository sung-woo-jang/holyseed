import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import { VrService } from '../vr.service';
import { VrEvent } from '../entities/vr-event.entity';
import { VrPendingOrder } from '../entities/vr-pending-order.entity';
import { VrFillKind } from '../entities';
import { decide, activeSession } from '../core';
import type { UsMarketCalendar, MarketSession } from '../core';

const SYMBOL = 'TQQQ';

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
 * VR(TQQQ 밸류 리밸런싱) 엔진 — laofus engine.service.ts와 동일한 구조(판단→회수→주문→체결반영).
 * DB(lab 스키마 vr_* 테이블)가 유일한 상태 원장. 계좌-DB 보유수량 불일치 또는 DB 오류 시 주문 없이 중단.
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

  /** 미회수 주문 처리 — 체결됐으면 DB 반영, 취소/거부면 FAILED. @returns 여전히 대기 중인 주문 수 */
  private async reconcile(runId: string | null): Promise<number> {
    const pendings = await this.pendingRepo.find({ where: { status: 'PENDING' }, order: { id: 'ASC' } });
    let remaining = 0;
    for (const p of pendings) {
      try {
        const order = await this.toss.getOrder(p.orderId);
        const filledQty = Number(order.execution.filledQuantity);
        if (order.status === 'FILLED') {
          const fill = await this.vrService.createFill({
            fillDate: kstDate(),
            kind: p.side === 'BUY' ? VrFillKind.BUY : VrFillKind.SELL,
            price: Number(order.execution.averageFilledPrice),
            quantity: filledQty,
            note: '엔진 자동매매 (회수)',
          });
          await this.pendingRepo.update({ id: p.id }, { status: 'APPLIED', appliedFillId: fill.id });
          await this.event(
            'info',
            `회수 반영: ${p.side} ${filledQty}주 @ $${order.execution.averageFilledPrice}`,
            runId,
          );
        } else if (['CANCELED', 'REJECTED'].includes(order.status)) {
          if (filledQty > 0) {
            const fill = await this.vrService.createFill({
              fillDate: kstDate(),
              kind: p.side === 'BUY' ? VrFillKind.BUY : VrFillKind.SELL,
              price: Number(order.execution.averageFilledPrice),
              quantity: filledQty,
              note: '엔진 자동매매 (부분체결 후 취소, 회수)',
            });
            await this.pendingRepo.update({ id: p.id }, { status: 'APPLIED', appliedFillId: fill.id });
            await this.event('warn', `주문 ${order.status}(부분 체결 반영): ${p.orderId}`, runId);
          } else {
            await this.pendingRepo.update({ id: p.id }, { status: 'FAILED' });
            await this.event(
              'error',
              `주문 ${order.status} — 미체결 종료: ${p.side} ${p.requestQuantity}주 (${p.orderId})`,
              runId,
            );
          }
        } else {
          remaining++;
        }
      } catch (e) {
        remaining++;
        await this.event('error', `회수 조회 실패: ${p.orderId} — ${e instanceof Error ? e.message : e}`, runId);
      }
    }
    return remaining;
  }

  /** 체결 폴링 — 프리/애프터마켓 LIMIT 주문은 즉시 체결 안 될 수 있음(정상), 다음 실행이 회수 */
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

      // 미회수 주문 먼저 처리
      const remainingPending = await this.reconcile(runId);

      // 활성 세션 판단 — force면 REGULAR로 간주(수동 테스트용)
      let session: MarketSession = 'REGULAR';
      if (!opts.force) {
        const cal = (await this.toss.getUsMarketCalendar()) as UsMarketCalendar;
        session = activeSession(cal);
        if (!session) {
          await this.event('info', '스킵: 활성 세션 없음 (휴장/장외)', runId);
          lines.push('스킵: 활성 세션 없음');
          return lines;
        }
        log(`활성 세션: ${session}`);
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

      // 시세 + 판단
      const price = Number((await this.toss.getPrice(SYMBOL)).lastPrice);
      log(
        `상태: 보유=${state.quantity}, 평단=$${state.avgPrice}, Pool=$${state.pool} | ` +
          `최소밴드=$${state.minBand}, 최대밴드=$${state.maxBand} | 현재가=$${price}`,
      );

      const decision = decide({ quantity: state.quantity, vValue: state.vValue, pool: state.pool }, price, {
        bandPct: settings.bandPct,
        poolLimitPct: settings.poolLimitPct,
      });

      if (decision.action === 'NONE') {
        await this.event('info', `판단: 주문 없음 — ${decision.reason} (현재가 $${price})`, runId);
        lines.push(`판단: 주문 없음 — ${decision.reason}`);
        return lines;
      }

      const desc =
        `${decision.action === 'BUY' ? '매수' : '매도'} ${decision.quantity}주 @ 약 $${price} = $${decision.estAmount}` +
        (decision.action === 'BUY' && decision.clamped ? ' (Pool 한도로 클램프됨)' : '');
      log(`판단: ${desc}`);

      if (!opts.live) {
        await this.event('info', `[dry] 판단: ${desc}`, runId);
        lines.push('dry-run — 주문 미실행');
        return lines;
      }

      // 실주문 — 미회수 주문이 남아 있으면 신규 주문 금지 (중복 매수 방지)
      if (remainingPending > 0) {
        await this.event('warn', `체결 대기 주문 ${remainingPending}건 미회수 — 신규 주문 스킵 (판단: ${desc})`, runId);
        lines.push('신규 주문 스킵 — 미회수 주문 존재');
        return lines;
      }

      if (decision.action === 'BUY') {
        const bp = Number(await this.toss.getBuyingPower('USD'));
        if (bp < decision.estAmount) {
          await this.event('error', `계좌 매수가능금액 $${bp} < 예상금액 $${decision.estAmount} — 주문 중단`, runId);
          lines.push('오류: 매수가능금액 부족');
          return lines;
        }
      }

      const clientOrderId = `vr-${kstDate()}-${kstHHmm()}-${decision.action === 'BUY' ? 'b' : 's'}`;
      const bufferPct = Number(process.env.VR_EXTENDED_LIMIT_BUFFER_PCT ?? 0.3) / 100;

      let placed: TossOrder;
      if (session === 'REGULAR') {
        placed =
          decision.action === 'BUY'
            ? await this.toss.buyByQuantity(SYMBOL, String(decision.quantity), clientOrderId)
            : await this.toss.sellByQuantityMarket(SYMBOL, String(decision.quantity), clientOrderId);
      } else {
        // 프리/애프터마켓 — marketable limit (현재가 대비 버퍼만큼 유리하게 걸어 사실상 즉시체결 유도)
        const limitPrice =
          decision.action === 'BUY' ? (price * (1 + bufferPct)).toFixed(2) : (price * (1 - bufferPct)).toFixed(2);
        placed =
          decision.action === 'BUY'
            ? await this.toss.buyByLimit(SYMBOL, String(decision.quantity), limitPrice, clientOrderId)
            : await this.toss.sellByLimit(SYMBOL, String(decision.quantity), limitPrice, clientOrderId);
        log(`지정가 주문(${session}): 버퍼 ${(bufferPct * 100).toFixed(2)}% → $${limitPrice}`);
      }
      log(`주문 접수: ${placed.orderId}`);

      // 주문 원장 기록 — 미체결이어도 다음 실행이 회수
      const pending = await this.pendingRepo.save(
        this.pendingRepo.create({
          orderId: placed.orderId,
          clientOrderId,
          symbol: SYMBOL,
          side: decision.action,
          requestQuantity: decision.quantity,
          cycleNo: state.cycle.cycleNo,
          status: 'PENDING',
        }),
      );

      const filled = await this.waitForFill(placed.orderId);
      if (filled) {
        const fill = await this.vrService.createFill({
          fillDate: kstDate(),
          kind: decision.action === 'BUY' ? VrFillKind.BUY : VrFillKind.SELL,
          price: Number(filled.execution.averageFilledPrice),
          quantity: Number(filled.execution.filledQuantity),
          note: '엔진 자동매매',
        });
        await this.pendingRepo.update({ id: pending.id }, { status: 'APPLIED', appliedFillId: fill.id });
        const summary = `체결 완료: ${desc}`;
        await this.event('info', summary, runId);
        lines.push(summary);
        return lines;
      }

      await this.event(
        'info',
        `주문 접수 완료(체결 대기): ${desc} — 다음 실행에서 자동 회수 (주문 ${placed.orderId.slice(0, 12)}…)`,
        runId,
      );
      lines.push('체결 대기 — 회수 예약됨');
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
