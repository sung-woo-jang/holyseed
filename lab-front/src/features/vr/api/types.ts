export type VrFillKind = 'INITIAL_BUY' | 'BUY' | 'SELL' | 'DEPOSIT'

export interface VrSettings {
  id: number
  symbol: string
  gFactor: number
  bandPct: number
  depositAmount: number
  poolLimitPct: number
}

export interface VrCycle {
  id: number
  cycleNo: number
  startDate: string
  endDate: string
  vValue: number
  poolStart: number
  poolEnd: number | null
  depositAmount: number
  isClosed: boolean
}

export interface VrFill {
  id: number
  fillDate: string
  kind: VrFillKind
  price: number
  quantity: number
  amount: number
  poolChange: number
  poolAfter: number
  qtyAfter: number
  avgPriceAfter: number
  cycleNo: number
  note: string | null
}

export interface VrState {
  settings: VrSettings
  cycle: VrCycle | null
  nextRenewalDate: string | null
  pool: number
  quantity: number
  avgPrice: number
  vValue: number
  minBand: number
  maxBand: number
  usablePool: number
  v2Preview: number | null
}

export interface CreateFillInput {
  fillDate: string
  kind: VrFillKind
  price: number
  quantity: number
  note?: string
}

export interface CreateCycleInput {
  cycleNo: number
  startDate: string
  endDate: string
  vValue: number
  poolStart: number
  depositAmount?: number
}

// ---- 엔진 상태 (자동매매) ----

export type VrMarketSession = 'PRE' | 'REGULAR' | 'AFTER' | null

export interface VrEventDto {
  id: number
  createdAt: string
  level: string
  source: string
  runId: string | null
  message: string
}

export interface VrLastRunDto {
  runId: string
  startedAt: string
  endedAt: string
  level: 'info' | 'warn' | 'error'
  summary: string
}

export interface VrEngineDto {
  mode: string
  schedulerEnabled: boolean
  running: boolean
  nextRun: string
  lastRun: VrLastRunDto | null
}

export interface VrStatusDto {
  state: VrState
  cycles: VrCycle[]
  events: VrEventDto[]
  activeSession: VrMarketSession
  engine: VrEngineDto
  calendar: unknown
  now: string
}
