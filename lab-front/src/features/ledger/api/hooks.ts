import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, LEDGER_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type {
  LedgerAsset,
  LedgerAssetInput,
  LedgerCategory,
  LedgerCategoryInput,
  LedgerSearchResult,
  LedgerTransaction,
  LedgerTransactionInput,
} from './types'

// ─── Categories ───────────────────────────────────────────────────────────

export function useLedgerCategories() {
  return useStandardQuery<LedgerCategory[]>({
    queryKey: ['ledger', 'categories'],
    queryFn: async () => (await axiosInstance.get<LedgerCategory[]>(LEDGER_API.CATEGORIES)).data,
  })
}

export function useCreateLedgerCategory() {
  const qc = useQueryClient()
  return useStandardMutation<LedgerCategory, Error, LedgerCategoryInput>({
    mutationFn: async (input) => (await axiosInstance.post<LedgerCategory>(LEDGER_API.CREATE_CATEGORY, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

export function useUpdateLedgerCategory() {
  const qc = useQueryClient()
  return useStandardMutation<LedgerCategory, Error, { id: number; input: Partial<LedgerCategoryInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<LedgerCategory>(LEDGER_API.UPDATE_CATEGORY(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

export function useDeleteLedgerCategory() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(LEDGER_API.DELETE_CATEGORY(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

// ─── Assets ───────────────────────────────────────────────────────────────

export function useLedgerAssets() {
  return useStandardQuery<LedgerAsset[]>({
    queryKey: ['ledger', 'assets'],
    queryFn: async () => (await axiosInstance.get<LedgerAsset[]>(LEDGER_API.ASSETS)).data,
  })
}

export function useCreateLedgerAsset() {
  const qc = useQueryClient()
  return useStandardMutation<LedgerAsset, Error, LedgerAssetInput>({
    mutationFn: async (input) => (await axiosInstance.post<LedgerAsset>(LEDGER_API.CREATE_ASSET, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

export function useUpdateLedgerAsset() {
  const qc = useQueryClient()
  return useStandardMutation<LedgerAsset, Error, { id: number; input: Partial<LedgerAssetInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<LedgerAsset>(LEDGER_API.UPDATE_ASSET(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

export function useDeleteLedgerAsset() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(LEDGER_API.DELETE_ASSET(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

// ─── Transactions ─────────────────────────────────────────────────────────

export function useLedgerMonth(year: number, month: number) {
  return useStandardQuery<LedgerSearchResult>({
    queryKey: ['ledger', 'transactions', 'month', year, month],
    queryFn: async () => (await axiosInstance.post<LedgerSearchResult>(LEDGER_API.SEARCH_TRANSACTIONS, { year, month })).data,
  })
}

export function useCreateLedgerTransaction() {
  const qc = useQueryClient()
  return useStandardMutation<LedgerTransaction, Error, LedgerTransactionInput>({
    mutationFn: async (input) => (await axiosInstance.post<LedgerTransaction>(LEDGER_API.CREATE_TRANSACTION, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

export function useUpdateLedgerTransaction() {
  const qc = useQueryClient()
  return useStandardMutation<LedgerTransaction, Error, { id: number; input: Partial<LedgerTransactionInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<LedgerTransaction>(LEDGER_API.UPDATE_TRANSACTION(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}

export function useDeleteLedgerTransaction() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(LEDGER_API.DELETE_TRANSACTION(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })
}
