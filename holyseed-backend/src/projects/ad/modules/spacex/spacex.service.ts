import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import { TossPriceHubService } from '@shared/toss/toss-price-hub.service';
import { SpacexEntry, SpacexState } from './entities';
import { CreateSpacexEntryDto } from './dto/request';

const SYMBOL = 'SPCX';
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
  /** 상장일 이후 전체 일봉 기준 — range와 무관 */
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

@Injectable()
export class SpacexService {
  private readonly logger = new Logger('Spacex');
  private candleCache: { candles: SpacexCandle[]; at: number } | null = null;
  private orderCache: { orders: TossOrder[]; at: number } | null = null;

  constructor(
    @InjectRepository(SpacexEntry) private readonly entryRepo: Repository<SpacexEntry>,
    @InjectRepository(SpacexState) private readonly stateRepo: Repository<SpacexState>,
    private readonly toss: TossClientService,
    private readonly hub: TossPriceHubService,
  ) {}

  /** 실시간 시세 — 가격 허브(5초 재사용·한도 보호) */
  private async getLivePrice(): Promise<number> {
    return (await this.hub.getPrice(SYMBOL)).price;
  }

  /**
   * 토스에서 SPCX(스페이스X) 체결 내역을 가져와 아직 기록 안 된 것만 채워 넣는다.
   * orderId로 중복을 막기 때문에 몇 번을 돌려도, 스케줄러가 겹쳐 돌아도 안전.
   */
  async syncFromToss(): Promise<{ synced: number }> {
    const { orders } = await this.toss.getOrders('CLOSED', { symbol: SYMBOL, limit: 100 });
    const filled = orders.filter((o) => o.status === 'FILLED' && o.execution.filledAt);
    const existingIds = new Set(
      (await this.entryRepo.find({ where: {}, select: ['orderId'] }))
        .map((e) => e.orderId)
        .filter((id): id is string => id !== null),
    );

    let synced = 0;
    for (const order of filled) {
      if (existingIds.has(order.orderId)) continue;
      await this.entryRepo.save(
        this.entryRepo.create({
          date: kstDate(new Date(order.execution.filledAt as string)),
          amount: Number(order.execution.filledAmount),
          price: order.execution.averageFilledPrice !== null ? Number(order.execution.averageFilledPrice) : null,
          quantity: Number(order.execution.filledQuantity),
          isRebalance: false,
          note: null,
          orderId: order.orderId,
        }),
      );
      synced++;
    }
    if (synced > 0) this.logger.log(`토스 SPCX 체결 ${synced}건 동기화`);
    await this.fillDayCandles(await this.entryRepo.find());
    return { synced };
  }

  /** 상장일부터의 일봉 전체(오래된 순) — 5분 캐시. 한 번에 못 받는 만큼은 nextBefore로 이어 받는다 */
  private async loadDailyCandles(): Promise<SpacexCandle[]> {
    if (this.candleCache && Date.now() - this.candleCache.at < CANDLE_TTL_MS) return this.candleCache.candles;
    const byDate = new Map<string, SpacexCandle>();
    let before: string | undefined;
    for (let page = 0; page < MAX_CANDLE_PAGES; page++) {
      const res = await this.toss.getCandles(SYMBOL, '1d', 200, before);
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
    this.candleCache = { candles, at: Date.now() };
    return candles;
  }

  /** 완결된 날(오늘 이전)의 일봉이 있으면 그 시가·고가·저가·종가를 기록에 채운다 — 이미 채워졌거나 일봉이 없으면 그대로 */
  private async fillDayCandles(entries: SpacexEntry[]): Promise<void> {
    const today = kstDate();
    const missing = entries.filter((e) => e.dayClose === null && e.date < today);
    if (missing.length === 0) return;
    try {
      const byDate = new Map((await this.loadDailyCandles()).map((c) => [c.date, c]));
      const toSave: SpacexEntry[] = [];
      for (const e of missing) {
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
      this.logger.warn(`일봉 채우기 실패: ${(e as Error).message}`);
    }
  }

  async getCandles(range: string): Promise<SpacexCandlesResult> {
    const all = await this.loadDailyCandles();
    const r: SpacexCandleRange = range === '1m' || range === '2w' ? range : 'all';
    const days = r === '1m' ? 30 : r === '2w' ? 14 : null;
    const since = days !== null ? kstDate(new Date(Date.now() - days * 86_400_000)) : null;
    const candles = since !== null ? all.filter((c) => c.date >= since) : all;

    let listing: SpacexCandlesResult['listing'] = null;
    if (all.length > 0) {
      const high = all.reduce((m, c) => (c.high > m.high ? c : m));
      const low = all.reduce((m, c) => (c.low < m.low ? c : m));
      listing = {
        date: all[0].date,
        openPrice: all[0].open,
        high: { price: high.high, date: high.date },
        low: { price: low.low, date: low.date },
      };
    }
    return { symbol: SYMBOL, range: r, candles, listing };
  }

  /** 최근 SPCX 주문(미체결 + 최근 종료 5건) — 30초 캐시 */
  private async loadRecentOrders(): Promise<TossOrder[]> {
    if (this.orderCache && Date.now() - this.orderCache.at < ORDER_TTL_MS) return this.orderCache.orders;
    const [open, closed] = await Promise.all([
      this.toss.getOrders('OPEN', { symbol: SYMBOL }),
      this.toss.getOrders('CLOSED', { symbol: SYMBOL, limit: 5 }),
    ]);
    const orders = [...open.orders, ...closed.orders];
    this.orderCache = { orders, at: Date.now() };
    return orders;
  }

  /** 가장 최근 매수 주문 — 체결 기록이 DB에 들어오기 전(다음날 09:10)에도 오늘 매수 상태를 보여주기 위함. 실패하면 null */
  private async getLatestOrder(): Promise<SpacexLatestOrder | null> {
    try {
      const buys = (await this.loadRecentOrders()).filter((o) => o.side === 'BUY');
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
      this.logger.warn(`최근 주문 조회 실패: ${(e as Error).message}`);
      return null;
    }
  }

  private async getOrCreateState(): Promise<SpacexState> {
    const [existing] = await this.stateRepo.find({ take: 1 });
    if (existing) return existing;
    return this.stateRepo.save(this.stateRepo.create({ closedAt: null }));
  }

  async createEntry(dto: CreateSpacexEntryDto): Promise<SpacexEntry> {
    const quantity = dto.quantity ?? (dto.price ? dto.amount / dto.price : null);
    const entry = await this.entryRepo.save(
      this.entryRepo.create({
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

  async close(date?: string): Promise<SpacexState> {
    const state = await this.getOrCreateState();
    state.closedAt = date ?? new Date().toISOString().slice(0, 10);
    return this.stateRepo.save(state);
  }

  async getStatus() {
    const [entries, state, latestOrder] = await Promise.all([
      this.entryRepo.find({ order: { date: 'ASC', id: 'ASC' } }),
      this.getOrCreateState(),
      this.getLatestOrder(),
    ]);
    // 일봉이 비어 있는 지난 기록은 조회 때 한 번 채워 둔다 (이미 채워졌으면 아무 일도 안 함)
    await this.fillDayCandles(entries);

    const startDate = entries.length > 0 ? entries[0].date : null;
    const totalPrincipal = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const daysCount = new Set(entries.map((e) => e.date)).size;

    const priced = entries.filter((e) => e.price !== null && e.quantity !== null && Number(e.quantity) > 0);
    const qtySum = priced.reduce((sum, e) => sum + Number(e.quantity), 0);
    const avgPrice =
      qtySum > 0 ? priced.reduce((sum, e) => sum + Number(e.price) * Number(e.quantity), 0) / qtySum : null;

    const lastPriced = [...entries].reverse().find((e) => e.price !== null);
    const lastPrice = lastPriced ? Number(lastPriced.price) : null;
    const profitPct = avgPrice !== null && lastPrice !== null ? (lastPrice / avgPrice - 1) * 100 : null;

    // 총 매수원금(넣은 돈) vs 현재 평가금액(지금 팔면 얼마) — 시세 조회 실패해도 나머지 상태는 정상 반환
    let currentPrice: number | null = null;
    let currentValue: number | null = null;
    try {
      currentPrice = await this.getLivePrice();
      currentValue = qtySum > 0 ? qtySum * currentPrice : null;
    } catch (e) {
      this.logger.warn(`실시간 시세 조회 실패: ${(e as Error).message}`);
    }

    return {
      startDate,
      closedAt: state.closedAt,
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
}
