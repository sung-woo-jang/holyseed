import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import { TossPriceHubService } from '@shared/toss/toss-price-hub.service';
import { DcaPlan, SpacexEntry } from './entities';
import { CreateSpacexEntryDto, UpsertDcaPlanDto } from './dto/request';

/** 종목 칸이 없던 시절의 기본 종목 — symbol을 안 넘긴 옛 호출은 전부 스페이스X */
export const DEFAULT_SYMBOL = 'SPCX';

/**
 * 처음부터 있어야 하는 모으기 계획 — 없으면 만들고, 있으면 건드리지 않는다(사용자가 바꾼 값 보존).
 * 새 종목은 여기 한 줄을 추가하거나 POST /ad/spacex/plans로 넣으면 된다.
 */
const DEFAULT_PLANS: Pick<DcaPlan, 'symbol' | 'name' | 'dailyAmount' | 'startDate' | 'sortOrder'>[] = [
  { symbol: 'SPCX', name: '스페이스X', dailyAmount: 2, startDate: '2026-09-21', sortOrder: 0 },
  { symbol: 'UPRO', name: 'UPRO', dailyAmount: 1, startDate: '2026-10-12', sortOrder: 1 },
];

/** 상장이 최근이라 상장일부터 전체 일봉을 보여주는 종목 — 그 외 종목은 모으기 시작 30일 전부터 */
const LISTING_SYMBOLS = new Set(['SPCX']);
const BEFORE_START_DAYS = 30;

const CANDLE_TTL_MS = 5 * 60_000;
const ORDER_TTL_MS = 30_000;
const MAX_CANDLE_PAGES = 5;

export type SpacexCandleRange = 'all' | '1m' | '2w';

export interface SpacexCandle {
  /** 한국시간 기준 날짜 YYYY-MM-DD */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SpacexCandlesResult {
  symbol: string;
  range: SpacexCandleRange;
  candles: SpacexCandle[];
  /** 상장일 이후 전체 일봉 기준 — range와 무관. 최근 상장 종목(SPCX)만 */
  listing: {
    date: string;
    openPrice: number;
    high: { price: number; date: string };
    low: { price: number; date: string };
  } | null;
}

export interface SpacexLatestOrder {
  orderId: string;
  status: 'PENDING' | 'FILLED' | 'CANCELED';
  /** 금액 주문의 주문 금액($), 체결됐으면 체결 금액 */
  amount: number | null;
  /** 체결됐으면 체결 수량, 아니면 토스의 추정 수량 */
  quantity: number | null;
  avgPrice: number | null;
  orderedAt: string;
  filledAt: string | null;
  /** 이미 기록(spacex_entries)에 동기화됐는지 — 체결 기록은 다음날 09:10 동기화로 들어온다 */
  recorded: boolean;
}

function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 그 날짜가 속한 주의 월요일 */
export function mondayOf(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
}

/** 기록 묶음의 원금·수량·평단 — 체결가가 있는 기록만 평단 계산에 쓴다 */
function summarize(entries: SpacexEntry[]) {
  const totalPrincipal = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  const priced = entries.filter((e) => e.price !== null && e.quantity !== null && Number(e.quantity) > 0);
  const quantity = priced.reduce((sum, e) => sum + Number(e.quantity), 0);
  const avgPrice =
    quantity > 0 ? priced.reduce((sum, e) => sum + Number(e.price) * Number(e.quantity), 0) / quantity : null;
  return { totalPrincipal, quantity, avgPrice, daysCount: new Set(entries.map((e) => e.date)).size };
}

/** 주별 누적 원금 — 첫 기록이 있는 주부터 이번 주까지, 종목마다 누적값 */
export function weeklyPrincipal(
  entries: Pick<SpacexEntry, 'symbol' | 'date' | 'amount'>[],
  symbols: string[],
  today: string,
) {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const weeks: { weekStart: string; principal: Record<string, number> }[] = [];
  const cum: Record<string, number> = Object.fromEntries(symbols.map((s) => [s, 0]));
  let i = 0;
  for (let w = mondayOf(sorted[0].date); w <= mondayOf(today); w = addDays(w, 7)) {
    const end = addDays(w, 6);
    while (i < sorted.length && sorted[i].date <= end) {
      cum[sorted[i].symbol] = (cum[sorted[i].symbol] ?? 0) + Number(sorted[i].amount);
      i++;
    }
    weeks.push({
      weekStart: w,
      principal: Object.fromEntries(Object.entries(cum).map(([s, v]) => [s, Math.round(v * 100) / 100])),
    });
  }
  return weeks;
}

/**
 * 모으기(토스 '주식 모으기'로 매일 소수점 매수하는 종목) 기록 — 주문은 토스가 내고 여기는 체결 내역을 읽어 기록만 한다.
 * 처음엔 스페이스X 전용이었어서 클래스·경로 이름이 spacex로 남아 있다(nginx가 /api/ad/spacex를 :8001로 보냄).
 */
@Injectable()
export class SpacexService {
  private readonly logger = new Logger('Spacex');
  private readonly candleCache = new Map<string, { candles: SpacexCandle[]; at: number }>();
  private readonly orderCache = new Map<string, { orders: TossOrder[]; at: number }>();

  constructor(
    @InjectRepository(SpacexEntry) private readonly entryRepo: Repository<SpacexEntry>,
    @InjectRepository(DcaPlan) private readonly planRepo: Repository<DcaPlan>,
    private readonly toss: TossClientService,
    private readonly hub: TossPriceHubService,
  ) {}

  /** 모으기 계획 목록(화면 순서) — 기본 계획이 없으면 먼저 만든다. 두 프로세스가 동시에 만들어도 orIgnore로 안전 */
  async getPlans(): Promise<DcaPlan[]> {
    const plans = await this.planRepo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
    const missing = DEFAULT_PLANS.filter((d) => !plans.some((p) => p.symbol === d.symbol));
    if (missing.length === 0) return plans;
    await this.planRepo
      .createQueryBuilder()
      .insert()
      .values(missing.map((d) => ({ ...d, closedAt: null })))
      .orIgnore()
      .execute();
    return this.planRepo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  private async getPlan(symbol: string): Promise<DcaPlan> {
    const plan = (await this.getPlans()).find((p) => p.symbol === symbol);
    if (!plan) throw new NotFoundException(`${symbol} 모으기 계획이 없습니다.`);
    return plan;
  }

  async upsertPlan(dto: UpsertDcaPlanDto): Promise<DcaPlan> {
    const plans = await this.getPlans();
    const existing = plans.find((p) => p.symbol === dto.symbol);
    if (existing) {
      Object.assign(existing, {
        name: dto.name ?? existing.name,
        dailyAmount: dto.dailyAmount ?? existing.dailyAmount,
        startDate: dto.startDate ?? existing.startDate,
      });
      return this.planRepo.save(existing);
    }
    return this.planRepo.save(
      this.planRepo.create({
        symbol: dto.symbol,
        name: dto.name ?? dto.symbol,
        dailyAmount: dto.dailyAmount ?? 1,
        startDate: dto.startDate ?? kstDate(),
        closedAt: null,
        sortOrder: plans.length,
      }),
    );
  }

  /** 실시간 시세 — 가격 허브(5초 재사용·한도 보호) */
  private async getLivePrice(symbol: string): Promise<number> {
    return (await this.hub.getPrice(symbol)).price;
  }

  /**
   * 모으기 종목마다 토스 체결 내역을 가져와 아직 기록 안 된 것만 채워 넣는다.
   * orderId로 중복을 막기 때문에 몇 번을 돌려도, 스케줄러가 겹쳐 돌아도 안전.
   * 종목별로 따로 조회해서 한 종목이 실패해도 다른 종목은 계속 기록한다.
   */
  async syncFromToss(): Promise<{ synced: number; bySymbol: Record<string, number> }> {
    const plans = await this.getPlans();
    const existingIds = new Set(
      (await this.entryRepo.find({ where: {}, select: ['orderId'] }))
        .map((e) => e.orderId)
        .filter((id): id is string => id !== null),
    );

    const bySymbol: Record<string, number> = {};
    for (const plan of plans) {
      try {
        const { orders } = await this.toss.getOrders('CLOSED', { symbol: plan.symbol, limit: 100 });
        // 모으기 기간(시작일~종료일) 체결만 — 같은 종목을 따로 사고판 주문까지 모으기로 잡지 않게
        const inPlan = (date: string) => date >= plan.startDate && (plan.closedAt === null || date <= plan.closedAt);
        const filled = orders.filter(
          (o) => o.status === 'FILLED' && o.execution.filledAt && inPlan(kstDate(new Date(o.execution.filledAt))),
        );
        let count = 0;
        for (const order of filled) {
          if (existingIds.has(order.orderId)) continue;
          await this.entryRepo.save(
            this.entryRepo.create({
              symbol: plan.symbol,
              date: kstDate(new Date(order.execution.filledAt as string)),
              amount: Number(order.execution.filledAmount),
              price: order.execution.averageFilledPrice !== null ? Number(order.execution.averageFilledPrice) : null,
              quantity: Number(order.execution.filledQuantity),
              isRebalance: false,
              note: null,
              orderId: order.orderId,
            }),
          );
          existingIds.add(order.orderId);
          count++;
        }
        bySymbol[plan.symbol] = count;
        if (count > 0) this.logger.log(`토스 ${plan.symbol} 체결 ${count}건 동기화`);
      } catch (e) {
        this.logger.error(`${plan.symbol} 동기화 실패: ${(e as Error).message}`);
      }
    }
    await this.fillDayCandles(await this.entryRepo.find());
    const synced = Object.values(bySymbol).reduce((a, b) => a + b, 0);
    return { synced, bySymbol };
  }

  /** 일봉(오래된 순) — 종목별 5분 캐시. 최근 상장 종목은 상장일까지 이어 받고, 그 외엔 최근 200거래일만 */
  private async loadDailyCandles(symbol: string): Promise<SpacexCandle[]> {
    const hit = this.candleCache.get(symbol);
    if (hit && Date.now() - hit.at < CANDLE_TTL_MS) return hit.candles;
    const byDate = new Map<string, SpacexCandle>();
    const maxPages = LISTING_SYMBOLS.has(symbol) ? MAX_CANDLE_PAGES : 1;
    let before: string | undefined;
    for (let page = 0; page < maxPages; page++) {
      const res = await this.toss.getCandles(symbol, '1d', 200, before);
      for (const c of res.candles) {
        const date = c.timestamp.slice(0, 10);
        byDate.set(date, {
          date,
          open: Number(c.openPrice),
          high: Number(c.highPrice),
          low: Number(c.lowPrice),
          close: Number(c.closePrice),
        });
      }
      if (!res.nextBefore) break;
      before = res.nextBefore;
    }
    const candles = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    this.candleCache.set(symbol, { candles, at: Date.now() });
    return candles;
  }

  /** 완결된 날(오늘 이전)의 일봉이 있으면 그 시가·고가·저가·종가를 기록에 채운다 — 이미 채워졌거나 일봉이 없으면 그대로 */
  private async fillDayCandles(entries: SpacexEntry[]): Promise<void> {
    const today = kstDate();
    const missing = entries.filter((e) => e.dayClose === null && e.date < today);
    if (missing.length === 0) return;
    const symbols = [...new Set(missing.map((e) => e.symbol ?? DEFAULT_SYMBOL))];
    for (const symbol of symbols) {
      try {
        const byDate = new Map((await this.loadDailyCandles(symbol)).map((c) => [c.date, c]));
        const toSave: SpacexEntry[] = [];
        for (const e of missing.filter((x) => (x.symbol ?? DEFAULT_SYMBOL) === symbol)) {
          const c = byDate.get(e.date);
          if (!c) continue;
          e.dayOpen = c.open;
          e.dayHigh = c.high;
          e.dayLow = c.low;
          e.dayClose = c.close;
          toSave.push(e);
        }
        if (toSave.length > 0) await this.entryRepo.save(toSave);
      } catch (e) {
        this.logger.warn(`${symbol} 일봉 채우기 실패: ${(e as Error).message}`);
      }
    }
  }

  async getCandles(range: string, symbol: string = DEFAULT_SYMBOL): Promise<SpacexCandlesResult> {
    const all = await this.loadDailyCandles(symbol);
    const r: SpacexCandleRange = range === '1m' || range === '2w' ? range : 'all';
    const days = r === '1m' ? 30 : r === '2w' ? 14 : null;
    const isListing = LISTING_SYMBOLS.has(symbol);
    let since: string | null = null;
    if (days !== null) since = kstDate(new Date(Date.now() - days * 86_400_000));
    else if (!isListing) {
      const plan = (await this.getPlans()).find((p) => p.symbol === symbol);
      if (plan) since = addDays(plan.startDate, -BEFORE_START_DAYS);
    }
    const candles = since !== null ? all.filter((c) => c.date >= since) : all;

    let listing: SpacexCandlesResult['listing'] = null;
    if (isListing && all.length > 0) {
      const high = all.reduce((m, c) => (c.high > m.high ? c : m));
      const low = all.reduce((m, c) => (c.low < m.low ? c : m));
      listing = {
        date: all[0].date,
        openPrice: all[0].open,
        high: { price: high.high, date: high.date },
        low: { price: low.low, date: low.date },
      };
    }
    return { symbol, range: r, candles, listing };
  }

  /** 그 종목의 최근 주문(미체결 + 최근 종료 5건) — 종목별 30초 캐시 */
  private async loadRecentOrders(symbol: string): Promise<TossOrder[]> {
    const hit = this.orderCache.get(symbol);
    if (hit && Date.now() - hit.at < ORDER_TTL_MS) return hit.orders;
    const [open, closed] = await Promise.all([
      this.toss.getOrders('OPEN', { symbol }),
      this.toss.getOrders('CLOSED', { symbol, limit: 5 }),
    ]);
    const orders = [...open.orders, ...closed.orders];
    this.orderCache.set(symbol, { orders, at: Date.now() });
    return orders;
  }

  /** 가장 최근 매수 주문 — 체결 기록이 DB에 들어오기 전(다음날 09:10)에도 오늘 매수 상태를 보여주기 위함. 실패하면 null */
  private async getLatestOrder(symbol: string): Promise<SpacexLatestOrder | null> {
    try {
      const buys = (await this.loadRecentOrders(symbol)).filter((o) => o.side === 'BUY');
      if (buys.length === 0) return null;
      const o = buys.reduce((m, c) => (Date.parse(c.orderedAt) > Date.parse(m.orderedAt) ? c : m));
      const status: SpacexLatestOrder['status'] =
        o.status === 'FILLED'
          ? 'FILLED'
          : ['CANCELED', 'REJECTED', 'EXPIRED'].includes(o.status)
            ? 'CANCELED'
            : 'PENDING';
      const filled = status === 'FILLED';
      const recorded = filled ? (await this.entryRepo.count({ where: { orderId: o.orderId } })) > 0 : false;
      const amountRaw = filled ? (o.execution.filledAmount ?? o.orderAmount) : o.orderAmount;
      return {
        orderId: o.orderId,
        status,
        amount: amountRaw != null ? Number(amountRaw) : null,
        quantity: filled ? Number(o.execution.filledQuantity) : Number(o.quantity),
        avgPrice: o.execution.averageFilledPrice != null ? Number(o.execution.averageFilledPrice) : null,
        orderedAt: o.orderedAt,
        filledAt: o.execution.filledAt,
        recorded,
      };
    } catch (e) {
      this.logger.warn(`${symbol} 최근 주문 조회 실패: ${(e as Error).message}`);
      return null;
    }
  }

  async createEntry(dto: CreateSpacexEntryDto): Promise<SpacexEntry> {
    const quantity = dto.quantity ?? (dto.price ? dto.amount / dto.price : null);
    const entry = await this.entryRepo.save(
      this.entryRepo.create({
        symbol: dto.symbol ?? DEFAULT_SYMBOL,
        date: dto.date,
        amount: dto.amount,
        price: dto.price ?? null,
        quantity,
        isRebalance: dto.isRebalance ?? false,
        note: dto.note ?? null,
      }),
    );
    await this.fillDayCandles([entry]);
    return entry;
  }

  async close(date?: string, symbol: string = DEFAULT_SYMBOL): Promise<DcaPlan> {
    const plan = await this.getPlan(symbol);
    plan.closedAt = date ?? kstDate();
    return this.planRepo.save(plan);
  }

  /** 시세 조회 실패해도 나머지는 정상 반환 */
  private async priceOrNull(symbol: string): Promise<number | null> {
    try {
      return await this.getLivePrice(symbol);
    } catch (e) {
      this.logger.warn(`${symbol} 실시간 시세 조회 실패: ${(e as Error).message}`);
      return null;
    }
  }

  async getStatus(symbol: string = DEFAULT_SYMBOL) {
    const plan = await this.getPlan(symbol);
    const [entries, latestOrder] = await Promise.all([
      this.entryRepo.find({ where: { symbol }, order: { date: 'ASC', id: 'ASC' } }),
      this.getLatestOrder(symbol),
    ]);
    // 일봉이 비어 있는 지난 기록은 조회 때 한 번 채워 둔다 (이미 채워졌으면 아무 일도 안 함)
    await this.fillDayCandles(entries);

    const { totalPrincipal, quantity: qtySum, avgPrice, daysCount } = summarize(entries);
    const lastPriced = [...entries].reverse().find((e) => e.price !== null);
    const lastPrice = lastPriced ? Number(lastPriced.price) : null;
    const profitPct = avgPrice !== null && lastPrice !== null ? (lastPrice / avgPrice - 1) * 100 : null;

    // 총 매수원금(넣은 돈) vs 현재 평가금액(지금 팔면 얼마)
    const currentPrice = await this.priceOrNull(symbol);
    const currentValue = currentPrice !== null && qtySum > 0 ? qtySum * currentPrice : null;

    return {
      symbol,
      name: plan.name,
      dailyAmount: plan.dailyAmount,
      planStartDate: plan.startDate,
      startDate: entries.length > 0 ? entries[0].date : null,
      closedAt: plan.closedAt,
      totalPrincipal,
      daysCount,
      avgPrice,
      lastPrice,
      profitPct,
      currentPrice,
      currentValue,
      latestOrder,
      entries: [...entries].reverse(),
    };
  }

  /** 모으기 전체 화면 — 종목별 요약(기록 없이)과 주별 누적 원금 */
  async getOverview() {
    const [plans, entries] = await Promise.all([
      this.getPlans(),
      this.entryRepo.find({ order: { date: 'ASC', id: 'ASC' } }),
    ]);
    const summaries = await Promise.all(
      plans.map(async (plan) => {
        const mine = entries.filter((e) => e.symbol === plan.symbol);
        const s = summarize(mine);
        const [currentPrice, latestOrder] = await Promise.all([
          this.priceOrNull(plan.symbol),
          this.getLatestOrder(plan.symbol),
        ]);
        return {
          symbol: plan.symbol,
          name: plan.name,
          dailyAmount: plan.dailyAmount,
          planStartDate: plan.startDate,
          closedAt: plan.closedAt,
          startDate: mine.length > 0 ? mine[0].date : null,
          buyCount: mine.length,
          daysCount: s.daysCount,
          totalPrincipal: s.totalPrincipal,
          quantity: s.quantity,
          avgPrice: s.avgPrice,
          currentPrice,
          currentValue: currentPrice !== null && s.quantity > 0 ? s.quantity * currentPrice : null,
          lastEntry: mine.length > 0 ? mine[mine.length - 1] : null,
          latestOrder,
        };
      }),
    );
    return {
      plans: summaries,
      weekly: weeklyPrincipal(
        entries,
        plans.map((p) => p.symbol),
        kstDate(),
      ),
    };
  }

  /** 전 종목 기록(최신순) — 매수 내역 화면용 */
  async getEntries(): Promise<SpacexEntry[]> {
    return this.entryRepo.find({ order: { date: 'DESC', id: 'DESC' } });
  }
}
