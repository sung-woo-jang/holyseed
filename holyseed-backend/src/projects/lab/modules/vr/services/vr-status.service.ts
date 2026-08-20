import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { TossClientService } from '@shared/toss/toss-client.service';
import { LaofusEngineState } from '@/projects/laofus/entities/engine-state.entity';
import { VrService } from '../vr.service';
import { VrEngineService } from './vr-engine.service';
import { VrSchedulerService } from './vr-scheduler.service';
import { VrEvent } from '../entities/vr-event.entity';
import { activeSession } from '../core';
import type { UsMarketCalendar } from '../core';

export interface VrLastRun {
  runId: string;
  startedAt: string;
  endedAt: string;
  level: 'info' | 'warn' | 'error';
  summary: string;
}

/** VR 대시보드 status 조립 — 토스 캘린더 호출은 캐시로 rate limit 보호 */
@Injectable()
export class VrStatusService {
  private calendarCache: { data: UsMarketCalendar; at: number } | null = null;
  private candleCache = new Map<string, { data: unknown; at: number }>();
  private priceCache: { price: number; ts: string; at: number } | null = null;
  private cashCache: { totalCash: number; laofusCash: number; vrCash: number; ts: string; at: number } | null = null;

  constructor(
    private readonly toss: TossClientService,
    private readonly vrService: VrService,
    private readonly engine: VrEngineService,
    private readonly scheduler: VrSchedulerService,
    @InjectRepository(VrEvent) private readonly eventRepo: Repository<VrEvent>,
    @InjectRepository(LaofusEngineState) private readonly laofusEngineRepo: Repository<LaofusEngineState>,
  ) {}

  private async getCalendar(): Promise<UsMarketCalendar> {
    if (this.calendarCache && Date.now() - this.calendarCache.at < 10 * 60_000) return this.calendarCache.data;
    const data = (await this.toss.getUsMarketCalendar()) as UsMarketCalendar;
    this.calendarCache = { data, at: Date.now() };
    return data;
  }

  async getPrice(): Promise<{ price: number; ts: string }> {
    if (this.priceCache && Date.now() - this.priceCache.at < 60_000) return this.priceCache;
    const p = await this.toss.getPrice('TQQQ');
    this.priceCache = { price: Number(p.lastPrice), ts: p.timestamp, at: Date.now() };
    return this.priceCache;
  }

  /**
   * VR 몫 실제현금 = 계좌 전체 실제 예수금 − 라오어 몫(engine_state.cash 합계, 같은 계좌를 라오어와 공유).
   * 체결 시에만 바뀌는 값이라 가격보다 긴 5분 캐시로 토스 API 호출 절약.
   */
  async getCashBalance(): Promise<{ totalCash: number; laofusCash: number; vrCash: number; ts: string }> {
    if (this.cashCache && Date.now() - this.cashCache.at < 5 * 60_000) return this.cashCache;
    const [totalCashStr, laofusStates] = await Promise.all([
      this.toss.getBuyingPower('USD'),
      this.laofusEngineRepo.find(),
    ]);
    const totalCash = Number(totalCashStr);
    const laofusCash = laofusStates.reduce((sum, s) => sum + Number(s.cash), 0);
    const vrCash = totalCash - laofusCash;
    this.cashCache = { totalCash, laofusCash, vrCash, ts: new Date().toISOString(), at: Date.now() };
    return this.cashCache;
  }

  async getCandles(range: string): Promise<unknown> {
    const hit = this.candleCache.get(range);
    if (hit && Date.now() - hit.at < 5 * 60_000) return hit.data;
    const data =
      range === 'intraday'
        ? await this.toss.getCandles('TQQQ', '1m', 200)
        : await this.toss.getCandles('TQQQ', '1d', range === '1m' ? 22 : range === '3m' ? 64 : 200);
    this.candleCache.set(range, { data, at: Date.now() });
    return data;
  }

  /** 최근 엔진 실행 1회를 이벤트(run_id)에서 복원 — 재시작에도 유지 */
  private async getLastRun(): Promise<VrLastRun | null> {
    const latest = await this.eventRepo.find({ where: { runId: Not(IsNull()) }, order: { id: 'DESC' }, take: 1 });
    if (!latest.length || !latest[0].runId) return null;
    const runEvents = await this.eventRepo.find({ where: { runId: latest[0].runId }, order: { id: 'ASC' } });
    const rank = { info: 0, warn: 1, error: 2 } as const;
    let worst: 'info' | 'warn' | 'error' = 'info';
    for (const e of runEvents) {
      const lv = e.level as 'info' | 'warn' | 'error';
      if (rank[lv] > rank[worst]) worst = lv;
    }
    const last = runEvents[runEvents.length - 1];
    return {
      runId: latest[0].runId,
      startedAt: runEvents[0].createdAt.toISOString(),
      endedAt: last.createdAt.toISOString(),
      level: worst,
      summary: last.message,
    };
  }

  async getStatus() {
    const [state, cycles, events, lastRun] = await Promise.all([
      this.vrService.getState(),
      this.vrService.findAllCycles(),
      this.eventRepo.find({ order: { id: 'DESC' }, take: 100 }),
      this.getLastRun(),
    ]);

    let calendar: UsMarketCalendar | null = null;
    let session: string | null = null;
    try {
      calendar = await this.getCalendar();
      session = activeSession(calendar);
    } catch {
      /* 캘린더 실패해도 status 반환 */
    }

    return {
      state,
      cycles,
      events,
      activeSession: session,
      engine: {
        mode: process.env.VR_LIVE === 'true' ? 'live' : 'dry-run',
        schedulerEnabled: process.env.VR_SCHEDULER !== 'false',
        running: this.engine.isRunning,
        nextRun: this.scheduler.getNextRun(),
        lastRun,
      },
      calendar,
      now: new Date().toISOString(),
    };
  }

  /** SSE 변경 감지용 서명 */
  async getChangeSignature(): Promise<string> {
    const [lastEvent, state] = await Promise.all([
      this.eventRepo.find({ order: { id: 'DESC' }, take: 1, select: { id: true } }),
      this.vrService.getState(),
    ]);
    return `${lastEvent[0]?.id ?? 0}:${state.pool}:${state.quantity}:${this.engine.isRunning ? 1 : 0}`;
  }

  async getEvents(cursor: number, level: string): Promise<{ events: VrEvent[]; nextCursor: number | null }> {
    const qb = this.eventRepo.createQueryBuilder('e').orderBy('e.id', 'DESC').take(50);
    if (cursor > 0) qb.andWhere('e.id < :cursor', { cursor });
    if (level && level !== 'all') qb.andWhere('e.level = :level', { level });
    const events = await qb.getMany();
    return { events, nextCursor: events.length === 50 ? events[events.length - 1].id : null };
  }
}
