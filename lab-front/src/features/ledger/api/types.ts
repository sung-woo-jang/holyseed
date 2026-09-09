export type LedgerType = 'INCOME' | 'EXPENSE'
export type LedgerCostType = 'FIXED' | 'VARIABLE'
export type LedgerAssetType = 'BANK' | 'CARD' | 'CASH' | 'INVESTMENT' | 'OTHER'

export interface LedgerCategory {
  id: number
  name: string
  icon: string
  color: string
  type: LedgerType
  costType: LedgerCostType | null
}

export interface LedgerCategoryInput {
  name: string
  icon: string
  color: string
  type: LedgerType
  costType?: LedgerCostType | null
}

export interface LedgerAsset {
  id: number
  name: string
  type: LedgerAssetType
  balance: number
}

export interface LedgerAssetInput {
  name: string
  type: LedgerAssetType
  balance?: number
}

export interface LedgerTransaction {
  id: number
  date: string
  type: LedgerType
  amount: number
  categoryId: number | null
  assetId: number | null
  title: string | null
  memo: string | null
}

export interface LedgerTransactionRecord extends LedgerTransaction {
  category: LedgerCategory | null
  asset: LedgerAsset | null
}

export interface LedgerTransactionInput {
  date: string
  type: LedgerType
  amount: number
  categoryId?: number | null
  assetId?: number | null
  title?: string
  memo?: string
}

export interface LedgerSearchResult {
  records: LedgerTransactionRecord[]
  categories: LedgerCategory[]
  assets: LedgerAsset[]
  summary: {
    totalIncome: number
    totalExpense: number
    netCashflow: number
    savingsRate: number
    byCategory: { categoryId: number; name: string; color: string; amount: number }[]
  }
}
