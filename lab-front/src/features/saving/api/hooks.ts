import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, SAVING_API, WORKLOG_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type { SavingPlan, SavingRecord, SavingRecordInput, SavingSummary } from './types'
import type { WorklogSearchResult } from '@/features/worklog/api/types'

export function useSavingRecords() {
  return useStandardQuery<SavingRecord[]>({
    queryKey: ['saving', 'records'],
    queryFn: async () => (await axiosInstance.get<SavingRecord[]>(SAVING_API.RECORDS)).data,
  })
}

export function useSavingSummary() {
  return useStandardQuery<SavingSummary>({
    queryKey: ['saving', 'summary'],
    queryFn: async () => (await axiosInstance.get<SavingSummary>(SAVING_API.SUMMARY)).data,
  })
}

export function usePlanPreview() {
  return useStandardMutation<SavingPlan, Error, { income: number }>({
    mutationFn: async (input) => (await axiosInstance.post<SavingPlan>(SAVING_API.PLAN, input)).data,
  })
}

export function useUpsertRecord() {
  const qc = useQueryClient()
  return useStandardMutation<SavingRecord, Error, SavingRecordInput>({
    mutationFn: async (input) => (await axiosInstance.post<SavingRecord>(SAVING_API.UPSERT, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saving'] }),
  })
}

export function useUpdateRecord() {
  const qc = useQueryClient()
  return useStandardMutation<SavingRecord, Error, { id: number; input: Partial<SavingRecordInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<SavingRecord>(SAVING_API.UPDATE(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saving'] }),
  })
}

export function useDeleteRecord() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(SAVING_API.DELETE(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saving'] }),
  })
}

/** 근무일지 월 실수령 합계 프리필용 */
export async function fetchWorklogMonthNet(yearMonth: string): Promise<number> {
  const [year, month] = yearMonth.split('-').map(Number)
  const res = await axiosInstance.post<WorklogSearchResult>(WORKLOG_API.SEARCH, { year, month })
  return res.data.data.summary.totalNet
}
