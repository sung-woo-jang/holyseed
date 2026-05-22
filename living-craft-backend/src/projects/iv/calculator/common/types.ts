export type Ticker = 'TQQQ' | 'SOXL'
export type Division = 20 | 40
export type InfiniteMode = 'cycle_start' | 'first_half' | 'second_half' | 'reverse'

export type ExecType =
  | 'buy_full'
  | 'buy_half_star'
  | 'buy_half_avg'
  | 'sell_quarter'
  | 'sell_fixed'
  | 'sell_moc'
  | 'no_exec'

export interface InfiniteState {
  ticker: Ticker
  division: Division
  principal: number
  cycleNo: number
  quantity: number
  cash: number
  avgPrice: number
  tValue: number
  mode: InfiniteMode
  recentCloses: number[]
  lastClose: number
}

export interface PlanRow {
  label: string
  price: number
  qty: number
  side: 'buy' | 'sell'
  execType?: ExecType
}

export interface DailyMetrics {
  starPct: number
  starPrice: number
  locBuyPrice: number
  locSellPrice: number
  onceAmount: number
  quarterSellQty: number
  fixedSellPrice: number
}

export interface DailyPlanResult {
  buyRows: PlanRow[]
  sellRows: PlanRow[]
  metrics: DailyMetrics
  largeNumberBuy: { suggested: number; label: string } | null
}

export interface FillInput {
  execType: ExecType
  price: number
  qty: number
}

export interface ApplyFillsResult {
  newState: InfiniteState
  cycleEnded: boolean
  profit?: number
  profitPct?: number
}
