import { labApi } from '../lib/lab-api';

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

export const vrApi = {
  state: () => labApi.get<VrState>('/vr/state').then((r) => r.data),
  price: () => labApi.get<{ price: number; ts: string }>('/vr/price').then((r) => r.data),
  cashBalance: () => labApi.get<{ totalCash: number; laofusCash: number; vrCash: number }>('/vr/cash-balance').then((r) => r.data),
  events: (cursor?: number, level?: string) =>
    labApi.get<{ events: VrEventDto[]; nextCursor: number | null }>('/vr/events', { params: { cursor, level } }).then((r) => r.data),
  fills: () => labApi.get<VrFill[]>('/vr/fills').then((r) => r.data),
  cycles: () => labApi.get<VrCycle[]>('/vr/cycles').then((r) => r.data),
  createFill: (dto: { fillDate: string; kind: VrFillKind; price: number; quantity: number; note?: string }) =>
    labApi.post<VrFill>('/vr/fills', dto).then((r) => r.data),
  deleteFill: (id: number) => labApi.post(`/vr/fills/${id}/delete`).then((r) => r.data),
  rollover: (dto: { newStartDate?: string; deposit?: number }) => labApi.post('/vr/cycles/rollover', dto).then((r) => r.data),
  updateSettings: (dto: Partial<Pick<VrSettings, 'symbol' | 'gFactor' | 'bandPct' | 'depositAmount' | 'poolLimitPct' | 'cardOrder' | 'hiddenCards'>>) =>
    labApi.post<VrSettings>('/vr/settings/update', dto).then((r) => r.data),
};
