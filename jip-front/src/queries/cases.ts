import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Case } from '@/types'

export function useCases(tag?: string) {
  return useQuery<Case[]>({
    queryKey: ['cases', tag],
    queryFn: () => api.get('/cases', { params: tag ? { tag } : {} }).then((r) => r.data.data),
  })
}

export function useRecentCases() {
  return useQuery<Case[]>({
    queryKey: ['cases', 'recent'],
    queryFn: () => api.get('/cases/recent').then((r) => r.data.data),
  })
}

export function useCase(id: string | number) {
  return useQuery<Case>({
    queryKey: ['case', id],
    queryFn: () => api.get(`/cases/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })
}
