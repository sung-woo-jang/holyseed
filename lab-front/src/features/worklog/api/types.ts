export type PayStatus = 'RECEIVED' | 'EXPECTED' | 'UNPAID' | 'DAYOFF'

export interface Worklog {
  id: number
  title: string
  workDate: string
  startTime: string | null
  endTime: string | null
  breakHours: number
  jobs: string[]
  payStatus: PayStatus
  dailyWage: number
  amount: number
  amountOverride: number | null
  address: string | null
  memo: string | null
  effectiveAmount: number
  netAmount: number
}

export interface WorklogSearchResult {
  records: Worklog[]
  summary: {
    workDays: number
    totalAmount: number
    totalNet: number
    receivedNet: number
    pendingNet: number
  }
}

export interface WorklogInput {
  title: string
  workDate: string
  startTime?: string
  endTime?: string
  breakHours?: number
  jobs?: string[]
  payStatus?: PayStatus
  dailyWage?: number
  amountOverride?: number | null
  address?: string
  memo?: string
}
