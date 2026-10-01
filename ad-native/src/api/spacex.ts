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
  entries: SpacexEntryDto[];
}

export const spacexApi = {
  status: () => api.get<SpacexStatusDto>('/spacex/status').then((r) => r.data),
  close: (date?: string) => api.post<{ closedAt: string | null }>('/spacex/close', { date }).then((r) => r.data),
};
