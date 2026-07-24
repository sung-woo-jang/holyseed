export type ExpenseKind = 'EXPENSE' | 'INCOME'
export type ExpenseType = 'FIXED_SAME' | 'FIXED_VARIABLE' | 'IRREGULAR'

export interface Expense {
  id: number
  title: string
  date: string
  kind: ExpenseKind
  category: string
  expenseType: ExpenseType | null
  amount: number
  memo: string | null
}

export interface ExpenseSearchResult {
  records: Expense[]
  summary: {
    totalIncome: number
    totalExpense: number
    netCashflow: number
    fixedExpenseTotal: number
    byCategory: { category: string; amount: number }[]
  }
}

export interface ExpenseInput {
  title: string
  date: string
  kind: ExpenseKind
  category: string
  expenseType?: ExpenseType | null
  amount: number
  memo?: string
}
