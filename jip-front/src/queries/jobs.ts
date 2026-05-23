import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Job } from '@/types'

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then((r) => r.data.data),
    enabled: !!id,
    retry: false,
  })
}
