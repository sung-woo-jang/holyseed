import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, EXPENSE_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type { Expense, ExpenseInput, ExpenseSearchResult } from './types'

export function useExpenseMonth(year: number, month: number) {
  return useStandardQuery<ExpenseSearchResult>({
    queryKey: ['expense', 'month', year, month],
    queryFn: async () => (await axiosInstance.post<ExpenseSearchResult>(EXPENSE_API.SEARCH, { year, month })).data,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useStandardMutation<Expense, Error, ExpenseInput>({
    mutationFn: async (input) => (await axiosInstance.post<Expense>(EXPENSE_API.CREATE, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense'] }),
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useStandardMutation<Expense, Error, { id: number; input: Partial<ExpenseInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<Expense>(EXPENSE_API.UPDATE(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense'] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(EXPENSE_API.DELETE(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense'] }),
  })
}
