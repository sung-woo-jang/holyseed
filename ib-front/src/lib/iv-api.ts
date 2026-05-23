import { api, unwrap } from './api'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface IvStrategy {
  id: string
  userId: string
  strategyType: string
  ticker: string
  principal: number
  cycleNo: number
  division: number
  createdAt: string
}

export interface IvState {
  strategyId: string
  quantity: number
  cash: number
  avgPrice: number
  lastClose: number
  mode: string
  tValue: number
  recentCloses: number[]
  updatedAt: string
}

export interface PlanRow {
  label: string
  price: number
  qty: number
  side: 'buy' | 'sell'
  execType?: string
}

export interface DailyPlan {
  id: string
  strategyId: string
  planDate: string
  tValue: number
  mode: string
  avgPrice: number
  cash: number
  closePrice: number
  buyRows: PlanRow[]
  sellRows: PlanRow[]
  largeNumberBuy: { suggested: number; label: string } | null
  createdAt: string
}

export interface IvExecution {
  id: string
  strategyId: string
  execDate: string
  execType: string
  execPrice: number
  execQty: number
  execAmount: number
  stateBefore: Record<string, unknown>
  stateAfter: Record<string, unknown>
  note?: string
  createdAt: string
}

export interface FillRowInput {
  execType: string
  price: number
  qty: number
  note?: string
}

export interface IvPrice {
  ticker: string
  priceDate: string
  closePrice: number
  highPrice: number | null
  fetchedAt: string
}

// ─────────────────────────────────────────
// API calls
// ─────────────────────────────────────────

export interface IvUserInfo {
  id: string
  email: string
  name: string
  createdAt: string
}

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/iv/auth/register', data).then((r) => r.data.data as { token: string; user: IvUserInfo }),
  login: (data: { email: string; password: string }) =>
    api.post('/iv/auth/login', data).then((r) => r.data.data as { token: string; user: IvUserInfo }),
  me: () => api.get('/iv/auth/me').then(unwrap<IvUserInfo>),
}

export const strategiesApi = {
  getAll: () => api.get('/iv/strategies').then(unwrap<IvStrategy[]>),
  create: (data: { strategyType: string; ticker: string; principal: number; division?: number }) =>
    api.post('/iv/strategies', data).then(unwrap<IvStrategy>),
  getOne: (id: string) => api.get(`/iv/strategies/${id}`).then(unwrap<IvStrategy>),
  getState: (id: string) => api.get(`/iv/strategies/${id}/state`).then(unwrap<IvState>),
  update: (id: string, data: { principal?: number; division?: number }) =>
    api.post(`/iv/strategies/${id}/update`, data).then(unwrap<IvStrategy>),
  delete: (id: string) => api.post(`/iv/strategies/${id}/delete`),
}

export const plansApi = {
  getToday: (id: string) => api.get(`/iv/strategies/${id}/plans/today`).then(unwrap<DailyPlan>),
  getByDate: (id: string, date: string) =>
    api.post(`/iv/strategies/${id}/plans/by-date`, { date }).then(unwrap<DailyPlan>),
}

export const executionsApi = {
  getAll: (id: string) => api.get(`/iv/strategies/${id}/executions`).then(unwrap<IvExecution[]>),
  create: (id: string, data: { execDate: string; rows: FillRowInput[] }) =>
    api.post(`/iv/strategies/${id}/executions`, data).then(unwrap<{ newState: IvState; cycleEnded: boolean; profit?: number; profitPct?: number }>),
}

export const cyclesApi = {
  startNext: (id: string, mode: 'compound' | 'simple') =>
    api.post(`/iv/strategies/${id}/cycles/start-next`, { mode }),
  forceEnd: (id: string) => api.post(`/iv/strategies/${id}/cycles/force-end`),
}

export const pricesApi = {
  getLatest: (ticker: string) => api.get(`/iv/prices/${ticker}/latest`).then(unwrap<IvPrice>),
  getHistory: (ticker: string) => api.get(`/iv/prices/${ticker}/history`).then(unwrap<IvPrice[]>),
  refresh: (ticker: string) => api.post(`/iv/prices/${ticker}/refresh`).then(unwrap<IvPrice>),
}
