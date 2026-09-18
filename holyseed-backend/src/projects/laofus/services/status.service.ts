import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import { VrFill, VrFillKind } from '@/projects/lab/modules/vr/entities/vr-fill.entity';
import { LaofusEngineService } from './engine.service';
import { LaofusSchedulerService } from './scheduler.service';
import { LaofusEngineState } from '../entities/engine-state.entity';
import { LaofusCycle } from '../entities/cycle.entity';
import { LaofusTrade } from '../entities/trade.entity';
import { LaofusEvent } from '../entities/event.entity';
import { LaofusPendingOrder } from '../entities/pending-order.entity';
import { LaofusAccountSnapshot } from '../entities/account-snapshot.entity';

export interface AssetTrendPoint {
  date: string;
  fx: number;
  tqqqQty: number;
  tqqqValueUsd: number;
  tqqqPrincipalUsd: number;
  soxlQty: number;
  soxlValueUsd: number;
  soxlPrincipalUsd: number;
  stockUsd: number;
  principalUsd: number;
  stockKrw: number;
  principalKrw: number;
}

/**
 * 같은 날 절반+절반 매수(LOC 2-leg 에뮬레이션이 둘 다 체결된 경우)를 화면용 전액 1건으로 병합.
 * DB trades 테이블 자체는 안 건드림 — 실제 주문 2건 나간 감사 기록은 보존, 조회 결과에서만 통합.
 * (2026-09 온주 LOC 전환 이후 computeBuyLocLegs가 "전액 매수" 판단을 별지점−0.01/평단 가격
 * 2건의 지정가로 미리 쪼개 걸어두는데, 마감가가 평단보다 낮으면 둘 다 체결돼 0.5+0.5=1.0으로
 * T는 정확히 맞지만 사이클 상세 화면엔 같은 날짜에 절반 2줄로 쪼개져 보이던 문제)
 */
function mergeSameDayHalfBuys(trades: LaofusTrade[]): LaofusTrade[] {
  const sorted = [...trades].sort((a, b) => a.seq - b.seq);
  const merged: LaofusTrade[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const next = sorted[i + 1];
    const pairs =
      next &&
      t.side === 'BUY' &&
      next.side === 'BUY' &&
      t.kind === '절반' &&
      next.kind === '절반' &&
      t.date === next.date &&
      Number(next.tBefore) === Number(t.tAfter);
    if (pairs) {
      merged.push({
        ...next, // avgAfter/qtyAfter/cashAfter/tAfter 등 최종 상태는 두번째 체결 기준
        kind: '전액',
        quantity: String(Number(t.quantity) + Number(next.quantity)),
        amount: String(Math.round((Number(t.amount) + Number(next.amount)) * 100) / 100),
        tBefore: t.tBefore,
        note: `LOC 2-leg 병합 표시(원 체결 #${t.id}+#${next.id})`,
      });
      i++; // next는 이미 소비했으니 건너뜀
    } else {
      merged.push(t);
    }
  }
  return merged.map((t, i) => ({ ...t, seq: i + 1 })); // 화면용 N차 번호 재부여(공백 없이)
}

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
    @InjectRepository(LaofusAccountSnapshot) private readonly snapshotRepo: Repository<LaofusAccountSnapshot>,
    @InjectRepository(LaofusTrade) private readonly tradeRepo: Repository<LaofusTrade>,
    @InjectRepository(VrFill) private readonly vrFillRepo: Repository<VrFill>,
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

  async getAccountSnapshots(): Promise<LaofusAccountSnapshot[]> {
    return this.snapshotRepo.find({ order: { date: 'ASC' } });
  }

  /**
   * 라오어(SOXL)+VR(TQQQ) 공유 계좌의 일별 결합 자산 추이 — account_snapshots를 그대로 가공,
   * 새 토스 호출·새 크론 없음. TQQQ 원금은 VR 입금 이력(VrFill) 누계, SOXL 원금은 그 날짜까지의
   * 최근 체결 평단가(LaofusTrade.avgAfter) × 그날 보유수량으로 근사(매입원가).
   */
  async getAssetTrend(): Promise<AssetTrendPoint[]> {
    const [snapshots, contributions, trades] = await Promise.all([
      this.snapshotRepo.find({ order: { date: 'ASC' } }),
      this.vrFillRepo.find({
        where: [{ kind: VrFillKind.INITIAL_BUY }, { kind: VrFillKind.DEPOSIT }],
        order: { fillDate: 'ASC', id: 'ASC' },
      }),
      this.tradeRepo.find({ order: { date: 'ASC', seq: 'ASC' } }),
    ]);

    let runningPrincipal = 0;
    const tqqqPrincipalSeries = contributions.map((c) => {
      runningPrincipal = Math.round((runningPrincipal + c.amount) * 100) / 100;
      return { date: c.fillDate, cumulative: runningPrincipal };
    });
    const soxlAvgSeries = trades.map((t) => ({ date: t.date, avgAfter: Number(t.avgAfter) }));

    const tqqqPrincipalAsOf = (date: string): number => {
      let result = 0;
      for (const p of tqqqPrincipalSeries) {
        if (p.date > date) break;
        result = p.cumulative;
      }
      return result;
    };
    const soxlAvgPriceAsOf = (date: string): number => {
      let result = 0;
      for (const p of soxlAvgSeries) {
        if (p.date > date) break;
        result = p.avgAfter;
      }
      return result;
    };

    return snapshots.map((s) => {
      const tqqq = s.holdingsJson?.find((h) => h.symbol === 'TQQQ');
      const soxl = s.holdingsJson?.find((h) => h.symbol === 'SOXL');
      const tqqqValueUsd = Math.round((tqqq?.marketValueUsd ?? 0) * 100) / 100;
      const soxlValueUsd = Math.round((soxl?.marketValueUsd ?? 0) * 100) / 100;
      const tqqqPrincipalUsd = tqqqPrincipalAsOf(s.date);
      const soxlPrincipalUsd = Math.round((soxl?.quantity ?? 0) * soxlAvgPriceAsOf(s.date) * 100) / 100;
      const stockUsd = Math.round((tqqqValueUsd + soxlValueUsd) * 100) / 100;
      const principalUsd = Math.round((tqqqPrincipalUsd + soxlPrincipalUsd) * 100) / 100;
      const fx = Number(s.fxRate);
      return {
        date: s.date,
        fx,
        tqqqQty: tqqq?.quantity ?? 0,
        tqqqValueUsd,
        tqqqPrincipalUsd,
        soxlQty: soxl?.quantity ?? 0,
        soxlValueUsd,
        soxlPrincipalUsd,
        stockUsd,
        principalUsd,
        stockKrw: Math.round(stockUsd * fx),
        principalKrw: Math.round(principalUsd * fx),
      };
    });
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
    // 같은 날 절반+절반 매수를 전액 1건으로 병합(화면용) — seq 순 정렬은 병합 헬퍼 내부에서 처리
    for (const c of cycles) c.trades = mergeSameDayHalfBuys(c.trades ?? []);

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
