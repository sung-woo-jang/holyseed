import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { TossClientService, TossOrder } from './toss-client.service';
import { LaofusEngineService } from './engine.service';
import { LaofusSchedulerService } from './scheduler.service';
import { LaofusEngineState } from '../entities/engine-state.entity';
import { LaofusCycle } from '../entities/cycle.entity';
import { LaofusEvent } from '../entities/event.entity';
import { LaofusPendingOrder } from '../entities/pending-order.entity';

export interface LaofusLastRun {
  runId: string;
  startedAt: string;
  endedAt: string;
  level: 'info' | 'warn' | 'error'; // 런 내 최악 레벨
  summary: string; // 마지막 이벤트 메시지 (체결 완료/스킵/[dry] 판단/엔진 오류 …)
}

/** 대시보드 status 조립 — 토스 API 캐시로 rate limit 보호 */
@Injectable()
export class LaofusStatusService {
  private calendarCache: { data: unknown; at: number } | null = null;
  private priceCache: { price: number; ts: string; at: number } | null = null;
  private accountCache: { data: unknown; at: number } | null = null;
  private ordersCache: { data: unknown; at: number } | null = null;
  private candleCache = new Map<string, { data: unknown; at: number }>();
  private orderCache = new Map<string, { data: TossOrder; at: number }>();

  constructor(
    private readonly toss: TossClientService,
    private readonly engine: LaofusEngineService,
    private readonly scheduler: LaofusSchedulerService,
    @InjectRepository(LaofusEngineState) private readonly stateRepo: Repository<LaofusEngineState>,
    @InjectRepository(LaofusCycle) private readonly cycleRepo: Repository<LaofusCycle>,
    @InjectRepository(LaofusEvent) private readonly eventRepo: Repository<LaofusEvent>,
    @InjectRepository(LaofusPendingOrder) private readonly pendingRepo: Repository<LaofusPendingOrder>,
  ) {}

  async getCalendar(): Promise<unknown> {
    if (this.calendarCache && Date.now() - this.calendarCache.at < 10 * 60_000) return this.calendarCache.data;
    const data = await this.toss.getUsMarketCalendar();
    this.calendarCache = { data, at: Date.now() };
    return data;
  }

  async getPrice(): Promise<{ price: number; ts: string }> {
    if (this.priceCache && Date.now() - this.priceCache.at < 60_000) return this.priceCache;
    const p = await this.toss.getPrice('SOXL');
    this.priceCache = { price: Number(p.lastPrice), ts: p.timestamp, at: Date.now() };
    return this.priceCache;
  }

  async getCandles(range: string): Promise<unknown> {
    const key = range;
    const hit = this.candleCache.get(key);
    if (hit && Date.now() - hit.at < 5 * 60_000) return hit.data;
    const data =
      range === 'intraday'
        ? await this.toss.getCandles('SOXL', '1m', 200)
        : await this.toss.getCandles('SOXL', '1d', range === '1m' ? 22 : range === '3m' ? 64 : 200);
    this.candleCache.set(key, { data, at: Date.now() });
    return data;
  }

  async getAccount(): Promise<unknown> {
    if (this.accountCache && Date.now() - this.accountCache.at < 60_000) return this.accountCache.data;
    const [holdings, bpUsd, bpKrw, fx] = await Promise.all([
      this.toss.getHoldingsAll(),
      this.toss.getBuyingPower('USD'),
      this.toss.getBuyingPower('KRW'),
      this.toss.getExchangeRate().catch(() => null),
    ]);
    const data = { holdings, buyingPower: { usd: bpUsd, krw: bpKrw }, exchangeRate: fx };
    this.accountCache = { data, at: Date.now() };
    return data;
  }

  async getOrders(): Promise<unknown> {
    if (this.ordersCache && Date.now() - this.ordersCache.at < 60_000) return this.ordersCache.data;
    const [open, closed] = await Promise.all([
      this.toss.getOrders('OPEN'),
      this.toss.getOrders('CLOSED', { limit: 20 }),
    ]);
    const data = { open: open.orders, closed: closed.orders };
    this.ordersCache = { data, at: Date.now() };
    return data;
  }

  /** 최근 엔진 실행 1회를 이벤트(run_id)에서 복원 — 재시작에도 유지 */
  private async getLastRun(): Promise<LaofusLastRun | null> {
    const latest = await this.eventRepo.find({
      where: { runId: Not(IsNull()) },
      order: { id: 'DESC' },
      take: 1,
    });
    if (!latest.length || !latest[0].runId) return null;
    const runEvents = await this.eventRepo.find({
      where: { runId: latest[0].runId },
      order: { id: 'ASC' },
    });
    const rank = { info: 0, warn: 1, error: 2 } as const;
    let worst: 'info' | 'warn' | 'error' = 'info';
    for (const e of runEvents) {
      const lv = e.level as 'info' | 'warn' | 'error';
      if (rank[lv] > rank[worst]) worst = lv;
    }
    const last = runEvents[runEvents.length - 1];
    return {
      runId: latest[0].runId,
      startedAt: runEvents[0].ts.toISOString(),
      endedAt: last.ts.toISOString(),
      level: worst,
      summary: last.message,
    };
  }

  async getStatus() {
    const [state, cycles, events, lastRun, pendingOrders] = await Promise.all([
      this.stateRepo.findOne({ where: { symbol: 'SOXL' } }),
      this.cycleRepo.find({
        where: { symbol: 'SOXL' },
        order: { cycleNo: 'DESC' },
        relations: { trades: true },
      }),
      this.eventRepo.find({ order: { id: 'DESC' }, take: 100 }),
      this.getLastRun(),
      this.pendingRepo.find({ where: { status: 'PENDING' }, order: { id: 'ASC' } }),
    ]);
    // trades seq 순 정렬 (relations는 순서 보장 안 됨)
    for (const c of cycles) c.trades?.sort((a, b) => a.seq - b.seq);

    let calendar: unknown = null;
    try {
      calendar = await this.getCalendar();
    } catch {
      /* 캘린더 실패해도 status 반환 */
    }

    return {
      state,
      cycles,
      events,
      pendingOrders,
      engine: {
        mode: process.env.LAOFUS_LIVE === 'true' ? 'live' : 'dry-run',
        schedulerEnabled: process.env.LAOFUS_SCHEDULER !== 'false',
        running: this.engine.isRunning,
        nextRuns: this.scheduler.getNextRuns(),
        lastRun,
      },
      calendar,
      now: new Date().toISOString(),
    };
  }

  /** SSE 변경 감지용 서명 — 실행 시작/종료 에지에서도 푸시되도록 running 포함 */
  async getChangeSignature(): Promise<string> {
    const [lastEvent, state] = await Promise.all([
      this.eventRepo.find({ order: { id: 'DESC' }, take: 1, select: { id: true } }),
      this.stateRepo.findOne({ where: { symbol: 'SOXL' }, select: { symbol: true, updatedAt: true } }),
    ]);
    return `${lastEvent[0]?.id ?? 0}:${state?.updatedAt?.getTime() ?? 0}:${this.engine.isRunning ? 1 : 0}`;
  }

  /** 토스 주문 단건 조회 (거래 상세용) — FILLED는 5분, 그 외 60초 캐시 */
  async getOrder(orderId: string): Promise<TossOrder> {
    if (!orderId) throw new BadRequestException('orderId 필요');
    const hit = this.orderCache.get(orderId);
    if (hit) {
      const ttl = hit.data.status === 'FILLED' ? 5 * 60_000 : 60_000;
      if (Date.now() - hit.at < ttl) return hit.data;
    }
    const data = await this.toss.getOrder(orderId);
    this.orderCache.set(orderId, { data, at: Date.now() });
    return data;
  }

  async getEvents(cursor: number, level: string): Promise<{ events: LaofusEvent[]; nextCursor: number | null }> {
    const qb = this.eventRepo.createQueryBuilder('e').orderBy('e.id', 'DESC').take(50);
    if (cursor > 0) qb.andWhere('e.id < :cursor', { cursor });
    if (level && level !== 'all') qb.andWhere('e.level = :level', { level });
    const events = await qb.getMany();
    return { events, nextCursor: events.length === 50 ? events[events.length - 1].id : null };
  }
}
