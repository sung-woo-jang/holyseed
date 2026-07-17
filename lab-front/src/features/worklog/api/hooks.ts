import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, WORKLOG_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type { Worklog, WorklogInput, WorklogSearchResult } from './types'

export function useWorklogMonth(year: number, month: number) {
  return useStandardQuery<WorklogSearchResult>({
    queryKey: ['worklog', 'month', year, month],
    queryFn: async () => (await axiosInstance.post<WorklogSearchResult>(WORKLOG_API.SEARCH, { year, month })).data,
  })
}

export function useCreateWorklog() {
  const qc = useQueryClient()
  return useStandardMutation<Worklog, Error, WorklogInput>({
    mutationFn: async (input) => (await axiosInstance.post<Worklog>(WORKLOG_API.CREATE, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog'] }),
  })
}

export function useUpdateWorklog() {
  const qc = useQueryClient()
  return useStandardMutation<Worklog, Error, { id: number; input: Partial<WorklogInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<Worklog>(WORKLOG_API.UPDATE(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog'] }),
  })
}

export function useDeleteWorklog() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(WORKLOG_API.DELETE(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worklog'] }),
  })
}
