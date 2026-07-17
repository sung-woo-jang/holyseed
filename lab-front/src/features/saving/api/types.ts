export interface SavingRecord {
  id: number
  yearMonth: string
  income: number
  savingRate: number
  savingTarget: number
  spendingLimit: number
  actualSaving: number | null
  memo: string | null
}

export interface SavingSummary {
  goal: number
  totalSaved: number
  progressPct: number
  avgMonthly: number
  monthCount: number
  expectedDoneAt: string | null
}

export interface SavingPlan {
  rate: number
  savingTarget: number
  spendingLimit: number
}

export interface SavingRecordInput {
  yearMonth: string
  income: number
  actualSaving?: number | null
  memo?: string
}
