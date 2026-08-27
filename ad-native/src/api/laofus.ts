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

export const laofusRestApi = {
  status: () => laofusApi.get<StatusDto>('/status').then((r) => r.data),
  price: () => laofusApi.get<{ price: number; ts: string }>('/price').then((r) => r.data),
  events: (cursor?: number, level?: string) =>
    laofusApi.get<{ events: EventDto[]; nextCursor: number | null }>('/events', { params: { cursor, level } }).then((r) => r.data),
};
