import { api } from '../lib/api';

export interface SpacexEntryDto {
  id: number;
  /** 종목 — 모으기 기록은 종목 공용(SPCX, UPRO …) */
  symbol: string;
  date: string;
  amount: number;
  price: number | null;
  quantity: number | null;
  isRebalance: boolean;
  note: string | null;
  /** 기록 날짜의 일봉 — 완결된 날만 자동으로 채워짐 (오늘 기록은 다음 날) */
  dayOpen?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  dayClose?: number | null;
}

export interface SpacexLatestOrderDto {
  orderId: string;
  status: 'PENDING' | 'FILLED' | 'CANCELED';
  /** 금액 주문의 주문 금액($), 체결됐으면 체결 금액 */
  amount: number | null;
  /** 체결됐으면 체결 수량, 아니면 토스의 추정 수량 */
  quantity: number | null;
  avgPrice: number | null;
  orderedAt: string;
  filledAt: string | null;
  /** 이미 기록에 동기화됐는지 (체결 기록은 다음날 09:10에 들어옴) */
  recorded: boolean;
}

export interface SpacexCandleDto {
  /** 한국시간 날짜 YYYY-MM-DD */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SpacexCandlesDto {
  symbol: string;
  range: 'all' | '1m' | '2w';
  candles: SpacexCandleDto[];
  /** 상장일 이후 전체 일봉 기준 */
  listing: {
    date: string;
    openPrice: number;
    high: { price: number; date: string };
    low: { price: number; date: string };
  } | null;
}

export interface SpacexStatusDto {
  symbol: string;
  name: string;
  /** 계획상 1회 매수 금액($) */
  dailyAmount: number;
  /** 계획상 모으기 시작일 — 첫 체결 전에도 있음 */
  planStartDate: string;
  /** 첫 기록 날짜 — 아직 기록이 없으면 null */
  startDate: string | null;
  closedAt: string | null;
  totalPrincipal: number;
  daysCount: number;
  avgPrice: number | null;
  lastPrice: number | null;
  profitPct: number | null;
  currentPrice: number | null;
  currentValue: number | null;
  latestOrder: SpacexLatestOrderDto | null;
  entries: SpacexEntryDto[];
}

export interface DcaPlanSummaryDto {
  symbol: string;
  name: string;
  dailyAmount: number;
  planStartDate: string;
  closedAt: string | null;
  startDate: string | null;
  buyCount: number;
  daysCount: number;
  totalPrincipal: number;
  quantity: number;
  avgPrice: number | null;
  currentPrice: number | null;
  currentValue: number | null;
  lastEntry: SpacexEntryDto | null;
  latestOrder: SpacexLatestOrderDto | null;
}

export interface DcaOverviewDto {
  plans: DcaPlanSummaryDto[];
  /** 주별 누적 원금 — 첫 기록 주부터 이번 주까지, 종목별 */
  weekly: { weekStart: string; principal: Record<string, number> }[];
}

/** 모으기(스페이스X·UPRO …) — 서버 경로는 처음 이름 그대로 /spacex. symbol을 안 주면 서버가 SPCX로 본다 */
export const spacexApi = {
  overview: () => api.get<DcaOverviewDto>('/spacex/overview').then((r) => r.data),
  entries: () => api.get<SpacexEntryDto[]>('/spacex/entries').then((r) => r.data),
  status: (symbol: string) => api.get<SpacexStatusDto>('/spacex/status', { params: { symbol } }).then((r) => r.data),
  candles: (range: 'all' | '1m' | '2w', symbol: string) =>
    api.get<SpacexCandlesDto>('/spacex/candles', { params: { range, symbol } }).then((r) => r.data),
  close: (symbol: string, date?: string) => api.post<{ closedAt: string | null }>('/spacex/close', { symbol, date }).then((r) => r.data),
};
