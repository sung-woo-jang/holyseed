import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SiteAsset } from '@/types'

export function useSiteAssets() {
  return useQuery<Record<string, SiteAsset>>({
    queryKey: ['site-assets'],
    queryFn: () => api.get('/site-assets').then((r) => r.data.data),
    staleTime: 1000 * 60 * 30,
  })
}
