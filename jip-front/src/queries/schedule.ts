import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ScheduleDay } from '@/types'

export function useSchedule() {
  return useQuery<ScheduleDay[]>({
    queryKey: ['schedule'],
    queryFn: () => api.get('/schedule').then((r) => r.data.data),
  })
}
