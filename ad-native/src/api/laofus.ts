import { laofusApi } from '../lib/laofus-api';

export interface EngineStateDto {
  symbol: string;
  t: string;
  quantity: string;
  avgPrice: string;
  cash: string;
  principal: string;
  cycleNo: number;
  cycleDone: boolean;
  updatedAt: string;
}

export interface TradeDto {
  id: number;
  seq: number;
  date: string;
  kind: string;
  side: string;
  price: string;
  quantity: string;
  amount: string;
  tBefore: string;
  tAfter: string;
  avgAfter: string;
  qtyAfter: string;
  cashAfter: string;
  orderId: string | null;
  note: string | null;
}

export interface CycleDto {
  id: number;
  cycleNo: number;
  startDate: string;
  endDate: string | null;
  principal: string;
  profit: string | null;
  profitPct: string | null;
  trades: TradeDto[];
}

export interface EventDto {
  id: number;
  ts: string;
  level: string;
  source: string;
  runId: string | null;
  message: string;
}

export interface LastRunDto {
  runId: string;
  startedAt: string;
  endedAt: string;
  level: 'info' | 'warn' | 'error';
  summary: string;
}

export interface EngineDto {
  mode: string;
  schedulerEnabled: boolean;
  running: boolean;
  nextRuns: { slot: string; at: string }[];
  lastRun: LastRunDto | null;
}

export interface MarketDayDto {
  date: string;
  regularMarket: { startTime: string; endTime: string } | null;
}

export interface StatusDto {
  state: EngineStateDto | null;
  cycles: CycleDto[];
  events: EventDto[];
  engine: EngineDto;
  calendar: {
    previousBusinessDay: MarketDayDto;
    today: MarketDayDto;
    nextBusinessDay: MarketDayDto;
  } | null;
  now: string;
}

export interface HoldingRow {
  symbol: string;
  name: string;
  quantity: string;
  averagePurchasePrice: string;
  lastPrice: string;
  marketValue: { amount: string; purchaseAmount: string };
  profitLoss: { amount: string; rate: string };
  dailyProfitLoss: { amount: string; rate: string };
}

export interface AccountDto {
  holdings: { items: HoldingRow[] };
  buyingPower: { usd: string; krw: string };
  exchangeRate: { rate: string; midRate: string } | null;
}

export interface AccountSnapshotDto {
  id: number;
  date: string;
  totalValueUsd: string;
  totalValueKrw: string;
  stockValueUsd: string;
  cashUsd: string;
  cashKrw: string;
  fxRate: string;
  holdingsJson: { symbol: string; quantity: number; marketValueUsd: number }[];
  createdAt: string;
}

export interface AssetTrendPoint {
  date: string;
  fx: number;
  tqqqQty: number;
  tqqqValueUsd: number;
  tqqqPrincipalUsd: number;
  soxlQty: number;
  soxlValueUsd: number;
  soxlPrincipalUsd: number;
  /** 전략(TQQQ·SOXL) 밖 보유분 = 모으기(SPCX·UPRO 등) 평가금 — stockUsd·수익률엔 포함 안 됨. 옛 서버 응답엔 없음 */
  dcaValueUsd?: number;
  stockUsd: number;
  principalUsd: number;
  stockKrw: number;
  principalKrw: number;
  cashUsd: number;
  cashKrw: number;
  totalValueUsd: number;
  totalValueKrw: number;
}

export type LiveSessionType = 'DAY' | 'PRE' | 'REGULAR' | 'AFTER' | 'CLOSED';

export interface LiveSessionDto {
  session: LiveSessionType;
  label: string;
  shortLabel: string;
  endsAt: string | null;
  next: { session: LiveSessionType; label: string; startsAt: string } | null;
  nextRegularOpenAt: string | null;
}

export interface LiveOrderDto {
  orderId: string;
  side: 'BUY' | 'SELL';
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
  session: LiveSessionDto | null;
  fx: number | null;
  totals: {
    marketValueUsd: number;
    marketValueKrw: number | null;
    /** 주문가능 잔고 (토스 매수가능금액) */
    cashUsd: number | null;
    cashKrw: number | null;
    /** 총 자산 = 주식 평가금 + 달러 잔고 (원화는 × 환율 + 원화 잔고) */
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

export interface CandlesDto {
  /** 최신순 일봉 */
  candles: { timestamp: string; openPrice: string; highPrice: string; lowPrice: string; closePrice: string; volume: string }[];
  nextBefore: string | null;
}

export interface OrderLogDto {
  id: number;
  cycleId: number;
  side: string;
  kind: string;
  leg: number | null;
  tBefore: number;
  tAfter: number;
  requestAmount: number | null;
  requestQuantity: number | null;
  status: string;
  appliedTradeId: number | null;
  placedAt: string;
}

export const laofusRestApi = {
  candles: (range: '1m' | '3m' | 'all' = 'all') => laofusApi.get<CandlesDto>('/candles', { params: { range } }).then((r) => r.data),
  orderLog: () => laofusApi.get<OrderLogDto[]>('/order-log').then((r) => r.data),
  status: () => laofusApi.get<StatusDto>('/status').then((r) => r.data),
  price: () => laofusApi.get<{ price: number; ts: string }>('/price').then((r) => r.data),
  live: () => laofusApi.get<LiveDto>('/live').then((r) => r.data),
  events: (cursor?: number, level?: string) =>
    laofusApi.get<{ events: EventDto[]; nextCursor: number | null }>('/events', { params: { cursor, level } }).then((r) => r.data),
  account: () => laofusApi.get<AccountDto>('/account').then((r) => r.data),
  accountSnapshots: () => laofusApi.get<AccountSnapshotDto[]>('/account-snapshots').then((r) => r.data),
  recordAccountSnapshot: () => laofusApi.post('/account-snapshot/run').then((r) => r.data),
  assetTrend: () => laofusApi.get<AssetTrendPoint[]>('/asset-trend').then((r) => r.data),
};
