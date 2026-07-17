import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, SCHEDULE_API } from '@/shared/api'
import { useStandardQuery, useStandardMutation } from '@/shared/hooks/custom-query'
import type { Schedule, ScheduleInput } from './types'

export function useSchedulesRange(from: string, to: string) {
  return useStandardQuery<Schedule[]>({
    queryKey: ['schedule', 'range', from, to],
    queryFn: async () => (await axiosInstance.post<Schedule[]>(SCHEDULE_API.SEARCH, { from, to })).data,
  })
}

export function useAllSchedules() {
  return useStandardQuery<Schedule[]>({
    queryKey: ['schedule', 'all'],
    queryFn: async () => (await axiosInstance.get<Schedule[]>(SCHEDULE_API.LIST)).data,
  })
}

export function useCreateSchedule() {
  const qc = useQueryClient()
  return useStandardMutation<Schedule, Error, ScheduleInput>({
    mutationFn: async (input) => (await axiosInstance.post<Schedule>(SCHEDULE_API.CREATE, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  })
}

export function useUpdateSchedule() {
  const qc = useQueryClient()
  return useStandardMutation<Schedule, Error, { id: number; input: Partial<ScheduleInput> }>({
    mutationFn: async ({ id, input }) => (await axiosInstance.post<Schedule>(SCHEDULE_API.UPDATE(id), input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  })
}

export function useDeleteSchedule() {
  const qc = useQueryClient()
  return useStandardMutation<null, Error, number>({
    mutationFn: async (id) => (await axiosInstance.post<null>(SCHEDULE_API.DELETE(id))).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  })
}
