/** API 응답 타입 (백엔드 Decimal은 문자열로 직렬화됨) */

export interface EngineStateDto {
  symbol: string
  t: string
  quantity: string
  avgPrice: string
  cash: string
  principal: string
  cycleNo: number
  cycleDone: boolean
  updatedAt: string
}

export interface TradeDto {
  id: number
  seq: number
  date: string
  kind: string
  side: string
  price: string
  quantity: string
  amount: string
  tBefore: string
  tAfter: string
  avgAfter: string
  qtyAfter: string
  cashAfter: string
  orderId: string | null
  note: string | null
}

export interface CycleDto {
  id: number
  cycleNo: number
  startDate: string
  endDate: string | null
  principal: string
  profit: string | null
  profitPct: string | null
  trades: TradeDto[]
}

export interface EventDto {
  id: number
  ts: string
  level: string
  source: string
  runId: string | null
  message: string
}

export interface MarketDayDto {
  date: string
  regularMarket: { startTime: string; endTime: string } | null
}

export interface LastRunDto {
  runId: string
  startedAt: string
  endedAt: string
  level: 'info' | 'warn' | 'error'
  summary: string
}

export interface EngineDto {
  mode: string
  schedulerEnabled: boolean
  running: boolean
  nextRuns: { slot: string; at: string }[]
  lastRun: LastRunDto | null
}

export interface StatusDto {
  state: EngineStateDto | null
  cycles: CycleDto[]
  events: EventDto[]
  engine: EngineDto
  calendar: {
    previousBusinessDay: MarketDayDto
    today: MarketDayDto
    nextBusinessDay: MarketDayDto
  } | null
  now: string
}

// ---- 토스 계좌/주문 (AccountPage·거래 상세 공용) ----
export interface HoldingRow {
  symbol: string
  name: string
  quantity: string
  averagePurchasePrice: string
  lastPrice: string
  marketValue: { amount: string; purchaseAmount: string }
  profitLoss: { amount: string; rate: string }
  dailyProfitLoss: { amount: string; rate: string }
}

export interface AccountDto {
  holdings: { items: HoldingRow[] }
  buyingPower: { usd: string; krw: string }
  exchangeRate: { rate: string; midRate: string } | null
}

export interface TossOrderDto {
  orderId: string
  symbol: string
  side: string
  orderType: string
  status: string
  quantity: string
  orderAmount: string | null
  orderedAt: string
  execution: {
    filledQuantity: string
    averageFilledPrice: string | null
    filledAmount: string | null
    commission?: string | null
    filledAt?: string | null
  }
}

export interface CandleDto {
  timestamp: string
  openPrice: string
  highPrice: string
  lowPrice: string
  closePrice: string
  volume: string
}

/** SuccessResponse 언래핑 fetch */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  const json = (await res.json()) as { success: boolean; message?: string; data: T }
  if (!res.ok || !json.success) throw new Error(json.message ?? `요청 실패 ${res.status}`)
  return json.data
}

// ---- 포맷 헬퍼 ----
export const n = (v: string | number | null | undefined): number => Number(v ?? 0)
export const usd = (v: number, d = 2): string =>
  `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`
export const krw = (v: number): string => `₩${Math.round(v).toLocaleString('ko-KR')}`
export const kst = (iso: string): string =>
  new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
export const kstDateOnly = (iso: string): string =>
  new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })
