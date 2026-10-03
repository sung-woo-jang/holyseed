import { api } from '../lib/api';

export type VrFillKind = 'INITIAL_BUY' | 'BUY' | 'SELL' | 'DEPOSIT';

export interface VrSettings {
  id: number;
  symbol: string;
  gFactor: number;
  bandPct: number;
  depositAmount: number;
  poolLimitPct: number;
  cardOrder: string[];
  hiddenCards: string[];
}

export type VrCalcSource = 'ROLLOVER' | 'MANUAL' | 'BACKFILL';

/** V₂ = V₁ + Pool ÷ G + 적립금 — 저장된 입력으로 서버가 다시 계산한 대조 결과 */
export interface VrVCalc {
  source: VrCalcSource | null;
  prevV: number | null;
  poolInput: number | null;
  g: number | null;
  deposit: number;
  poolTerm: number | null;
  result: number;
  recomputed: number | null;
  delta: number | null;
  matches: boolean | null;
  growth: number | null;
  growthPct: number | null;
}

export interface VrCycle {
  id: number;
  cycleNo: number;
  startDate: string;
  endDate: string | null;
  vValue: number;
  poolStart: number;
  poolEnd: number | null;
  depositAmount: number;
  isClosed: boolean;
  minBand: number;
  maxBand: number;
  /** 이 사이클에서 체결한 매수·매도 금액 합 */
  tradeAmount: number;
  bandPct?: number | null;
  rolledAt?: string | null;
  /** 구 서버 응답에는 없을 수 있음 */
  vCalc?: VrVCalc;
}

export interface VrFill {
  id: number;
  fillDate: string;
  kind: VrFillKind;
  price: number;
  quantity: number;
  amount: number;
  poolChange: number;
  poolAfter: number;
  qtyAfter: number;
  avgPriceAfter: number;
  cycleNo: number | null;
  note: string | null;
}

export interface VrState {
  settings: VrSettings;
  cycle: VrCycle | null;
  nextRenewalDate: string | null;
  pool: number;
  quantity: number;
  avgPrice: number;
  vValue: number;
  minBand: number;
  maxBand: number;
  usablePool: number;
  v2Preview: number | null;
  initialCapital: number;
  investedPrincipal: number;
}

export interface VrEventDto {
  id: number;
  ts: string;
  level: string;
  source: string;
  runId: string | null;
  message: string;
}

export interface VrLastRunDto {
  runId: string;
  startedAt: string;
  endedAt: string;
  level: string;
  summary: string;
}

export interface VrStatusDto {
  activeSession: string | null;
  engine: {
    mode: 'live' | 'dry-run';
    schedulerEnabled: boolean;
    running: boolean;
    nextRun: string | null;
    lastRun: VrLastRunDto | null;
  };
  now: string;
}

export interface VrWealthHistoryPoint {
  date: string;
  tqqqValue: number;
  cumulativePrincipal: number;
  /** 그 날짜까지의 마지막 체결 기준 VR Pool */
  pool: number;
  /** 계좌총액 = TQQQ 평가금 + Pool */
  totalAssets: number;
}

export interface VrCandlesDto {
  /** 최신순 일봉 */
  candles: { timestamp: string; openPrice: string; highPrice: string; lowPrice: string; closePrice: string; volume: string }[];
  nextBefore: string | null;
}

export const vrApi = {
  candles: (range: '1m' | '3m' | 'all' = 'all') => api.get<VrCandlesDto>('/vr/candles', { params: { range } }).then((r) => r.data),
  state: () => api.get<VrState>('/vr/state').then((r) => r.data),
  price: () => api.get<{ price: number; ts: string }>('/vr/price').then((r) => r.data),
  cashBalance: () => api.get<{ totalCash: number; laofusCash: number; vrCash: number }>('/vr/cash-balance').then((r) => r.data),
  events: (cursor?: number, level?: string) =>
    api.get<{ events: VrEventDto[]; nextCursor: number | null }>('/vr/events', { params: { cursor, level } }).then((r) => r.data),
  status: () => api.get<VrStatusDto>('/vr/status').then((r) => r.data),
  fills: () => api.get<VrFill[]>('/vr/fills').then((r) => r.data),
  cycles: () => api.get<VrCycle[]>('/vr/cycles').then((r) => r.data),
  wealthHistory: () => api.get<VrWealthHistoryPoint[]>('/vr/wealth-history').then((r) => r.data),
  createFill: (dto: { fillDate: string; kind: VrFillKind; price: number; quantity: number; note?: string }) =>
    api.post<VrFill>('/vr/fills', dto).then((r) => r.data),
  deleteFill: (id: number) => api.post(`/vr/fills/${id}/delete`).then((r) => r.data),
  rollover: (dto: { newStartDate?: string; deposit?: number }) => api.post('/vr/cycles/rollover', dto).then((r) => r.data),
  updateSettings: (dto: Partial<Pick<VrSettings, 'symbol' | 'gFactor' | 'bandPct' | 'depositAmount' | 'poolLimitPct' | 'cardOrder' | 'hiddenCards'>>) =>
    api.post<VrSettings>('/vr/settings/update', dto).then((r) => r.data),
};
