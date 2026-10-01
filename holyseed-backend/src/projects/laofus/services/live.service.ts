import { Injectable, Logger } from '@nestjs/common';
import { TossClientService, TossHoldingItem, TossOrder } from '@shared/toss/toss-client.service';
import { HUB_SYMBOLS, HubPrice, TossPriceHubService } from '@shared/toss/toss-price-hub.service';
import { getUsMarketSession, UsSessionInfo } from '@shared/toss/us-market-session';
import { LaofusStatusService } from './status.service';

const HOLDINGS_TTL_MS = 30_000;
const ORDERS_TTL_MS = 30_000;
/** 무매 LOC 매수 주문이 현재가에서 이만큼(%) 벌어지면 경고로 표시 */
const ALERT_DISTANCE_PCT = 15;

const SYMBOL_LABEL: Record<string, string> = { TQQQ: 'VR', SOXL: '무매', SPCX: '스페이스X' };

export interface LiveOrderDto {
  orderId: string;
  side: 'BUY' | 'SELL';
  /** LOC / 지정가 / 시장가 / 그 외 토스 주문유형 */
  type: string;
  quantity: number;
  /** 금액으로 낸 주문(스페이스X 매일 매수 등)의 주문 금액 USD — 이때 quantity는 토스의 추정 수량 */
  amount: number | null;
  price: number | null;
  /** (주문가 − 현재가) ÷ 현재가, % 단위 */
  distancePct: number | null;
  alert: boolean;
}

export interface LiveSymbolDto {
  symbol: string;
  label: string;
  price: number | null;
  ts: string | null;
  stale: boolean;
  changePct: number | null;
  quantity: number | null;
  avgPrice: number | null;
  marketValueUsd: number | null;
  profitPct: number | null;
  orders: LiveOrderDto[];
}

export interface LiveDto {
  now: string;
  session: UsSessionInfo | null;
  fx: number | null;
  totals: {
    marketValueUsd: number;
    marketValueKrw: number | null;
    /** 주문가능 잔고 (토스 매수가능금액) */
    cashUsd: number | null;
    cashKrw: number | null;
    /** 총 자산 = 주식 평가금 + 달러 잔고 (원화는 × 환율 + 원화 잔고) — 실계좌 자산 스냅샷과 같은 기준 */
    totalAssetsUsd: number | null;
    totalAssetsKrw: number | null;
    profitUsd: number;
    profitPct: number | null;
    dayProfitUsd: number;
    dayProfitPct: number | null;
  } | null;
  symbols: LiveSymbolDto[];
  /** 일부 조회가 실패해 값이 비어 있음 */
  partial: boolean;
}

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function orderType(o: TossOrder): string {
  if (o.orderType === 'LIMIT' && o.timeInForce === 'CLS') return 'LOC';
  if (o.orderType === 'LIMIT') return '지정가';
  if (o.orderType === 'MARKET') return '시장가';
  return o.orderType;
}

class TtlCache<T> {
  private value: { data: T; at: number } | null = null;
  private inflight: Promise<T> | null = null;

  constructor(
    private readonly ttlMs: number,
    private readonly load: () => Promise<T>,
  ) {}

  async get(): Promise<T> {
    if (this.value && Date.now() - this.value.at < this.ttlMs) return this.value.data;
    if (!this.inflight) {
      this.inflight = this.load()
        .then((data) => {
          this.value = { data, at: Date.now() };
          return data;
        })
        .finally(() => {
          this.inflight = null;
        });
    }
    return this.inflight;
  }
}

/** 시세 탭용 조립 — 가격은 허브(5초), 보유·미체결은 30초 캐시(토스 계좌 조회 한도 보호). 주문 엔진과 무관한 읽기 전용 */
@Injectable()
export class LaofusLiveService {
  private readonly logger = new Logger(LaofusLiveService.name);
  private readonly holdings: TtlCache<{
    items: TossHoldingItem[];
    fx: number | null;
    cashUsd: number | null;
    cashKrw: number | null;
  }>;
  private readonly openOrders: TtlCache<TossOrder[]>;

  constructor(
    private readonly toss: TossClientService,
    private readonly hub: TossPriceHubService,
    private readonly status: LaofusStatusService,
  ) {
    this.holdings = new TtlCache(HOLDINGS_TTL_MS, async () => {
      const [h, fx, cashUsd, cashKrw] = await Promise.all([
        this.toss.getHoldingsAll(),
        this.toss.getExchangeRate().catch(() => null),
        this.toss.getBuyingPower('USD').catch(() => null),
        this.toss.getBuyingPower('KRW').catch(() => null),
      ]);
      return {
        items: h.items,
        fx: fx ? Number(fx.rate) : null,
        cashUsd: cashUsd !== null ? Number(cashUsd) : null,
        cashKrw: cashKrw !== null ? Number(cashKrw) : null,
      };
    });
    this.openOrders = new TtlCache(ORDERS_TTL_MS, async () => (await this.toss.getOrders('OPEN')).orders);
  }

  async getLive(): Promise<LiveDto> {
    const [prices, holdings, orders, calendar] = await Promise.all([
      Promise.all(
        HUB_SYMBOLS.map((s) =>
          this.hub
            .getPrice(s)
            .then<HubPrice | null>((p) => p)
            .catch(() => null),
        ),
      ),
      this.holdings.get().catch((e: unknown) => this.logFail('보유', e)),
      this.openOrders.get().catch((e: unknown) => this.logFail('미체결', e)),
      this.status.getCalendar().catch((e: unknown) => this.logFail('장 일정', e)),
    ]);

    const fx = holdings?.fx ?? null;
    const symbols = HUB_SYMBOLS.map((symbol, i) =>
      this.buildSymbol(symbol, prices[i], holdings?.items.find((h) => h.symbol === symbol) ?? null, orders ?? []),
    );
    const partial = prices.some((p) => p === null) || !holdings || !orders;

    return {
      now: new Date().toISOString(),
      session: getUsMarketSession(calendar),
      fx,
      totals: holdings ? this.buildTotals(symbols, holdings.items, fx, holdings.cashUsd, holdings.cashKrw) : null,
      symbols,
      partial,
    };
  }

  private logFail(what: string, e: unknown): null {
    this.logger.warn(`시세 탭 ${what} 조회 실패: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }

  private buildSymbol(
    symbol: string,
    hubPrice: HubPrice | null,
    holding: TossHoldingItem | null,
    openOrders: TossOrder[],
  ): LiveSymbolDto {
    const price = hubPrice?.price ?? (holding ? Number(holding.lastPrice) : null);
    const quantity = holding ? Number(holding.quantity) : null;
    const purchase = holding ? Number(holding.marketValue.purchaseAmount) : null;
    const marketValue = price !== null && quantity !== null ? quantity * price : null;
    const profit = marketValue !== null && purchase !== null ? marketValue - purchase : null;

    // 오늘 등락: 보유 조회가 알려주는 (마지막가, 일간 손익률)로 전일 종가를 거꾸로 구해 현재가와 비교
    let changePct: number | null = null;
    if (holding && price !== null) {
      const dailyRate = Number(holding.dailyProfitLoss.rate);
      const prevClose = Number(holding.lastPrice) / (1 + dailyRate);
      if (Number.isFinite(prevClose) && prevClose > 0) changePct = round((price / prevClose - 1) * 100);
    }

    const orders: LiveOrderDto[] = openOrders
      .filter((o) => o.symbol === symbol)
      .map((o) => {
        const orderPrice = o.price != null ? Number(o.price) : null;
        const distancePct = orderPrice !== null && price !== null ? round(((orderPrice - price) / price) * 100) : null;
        return {
          orderId: o.orderId,
          side: o.side,
          type: orderType(o),
          quantity: Number(o.quantity),
          amount: o.orderAmount != null ? Number(o.orderAmount) : null,
          price: orderPrice,
          distancePct,
          alert:
            symbol === 'SOXL' &&
            o.side === 'BUY' &&
            o.timeInForce === 'CLS' &&
            distancePct !== null &&
            Math.abs(distancePct) >= ALERT_DISTANCE_PCT,
        };
      })
      .sort((a, b) => {
        if (a.side !== b.side) return a.side === 'BUY' ? -1 : 1;
        return Math.abs(a.distancePct ?? Infinity) - Math.abs(b.distancePct ?? Infinity);
      });

    return {
      symbol,
      label: SYMBOL_LABEL[symbol] ?? symbol,
      price: price !== null ? round(price, 4) : null,
      ts: hubPrice?.ts ?? null,
      stale: hubPrice ? hubPrice.stale : true,
      changePct,
      quantity,
      avgPrice: holding ? Number(holding.averagePurchasePrice) : null,
      marketValueUsd: marketValue !== null ? round(marketValue) : null,
      profitPct: profit !== null && purchase ? round((profit / purchase) * 100) : null,
      orders,
    };
  }

  /** 총계: 허브 가격이 있는 종목은 실시간 평가금으로, 그 외 보유는 토스가 준 평가금 그대로 */
  private buildTotals(
    symbols: LiveSymbolDto[],
    items: TossHoldingItem[],
    fx: number | null,
    cashUsd: number | null,
    cashKrw: number | null,
  ): LiveDto['totals'] {
    let marketValue = 0;
    let purchase = 0;
    let dayProfit = 0;
    for (const h of items) {
      const live = symbols.find((s) => s.symbol === h.symbol && s.price !== null);
      const qty = Number(h.quantity);
      const lastPrice = Number(h.lastPrice);
      const price = live?.price ?? lastPrice;
      const prevClose = lastPrice / (1 + Number(h.dailyProfitLoss.rate));
      marketValue += qty * price;
      purchase += Number(h.marketValue.purchaseAmount);
      dayProfit += Number.isFinite(prevClose) ? qty * (price - prevClose) : Number(h.dailyProfitLoss.amount);
    }
    const profit = marketValue - purchase;
    const dayBase = marketValue - dayProfit;
    return {
      marketValueUsd: round(marketValue),
      marketValueKrw: fx !== null ? Math.round(marketValue * fx) : null,
      cashUsd: cashUsd !== null ? round(cashUsd) : null,
      cashKrw,
      totalAssetsUsd: cashUsd !== null ? round(marketValue + cashUsd) : null,
      totalAssetsKrw:
        cashUsd !== null && fx !== null ? Math.round((marketValue + cashUsd) * fx + (cashKrw ?? 0)) : null,
      profitUsd: round(profit),
      profitPct: purchase > 0 ? round((profit / purchase) * 100) : null,
      dayProfitUsd: round(dayProfit),
      dayProfitPct: dayBase > 0 ? round((dayProfit / dayBase) * 100) : null,
    };
  }
}
