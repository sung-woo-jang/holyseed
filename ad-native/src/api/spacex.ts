import { api } from '../lib/api';

export interface SpacexEntryDto {
  id: number;
  date: string;
  amount: number;
  price: number | null;
  quantity: number | null;
  isRebalance: boolean;
  note: string | null;
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

export const spacexApi = {
  status: () => api.get<SpacexStatusDto>('/spacex/status').then((r) => r.data),
  candles: (range: 'all' | '1m' | '2w') => api.get<SpacexCandlesDto>('/spacex/candles', { params: { range } }).then((r) => r.data),
  close: (date?: string) => api.post<{ closedAt: string | null }>('/spacex/close', { date }).then((r) => r.data),
};
