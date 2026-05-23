import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category, ServiceItem, FullCatalog } from '@/types'

export function useCatalog() {
  return useQuery<FullCatalog>({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then((r) => r.data.data),
  })
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/catalog/categories').then((r) => r.data.data),
  })
}

export function useServiceItems(catCode?: string) {
  return useQuery<ServiceItem[]>({
    queryKey: ['items', catCode],
    queryFn: () => api.get('/catalog/items', { params: catCode ? { cat: catCode } : {} }).then((r) => r.data.data),
  })
}

export function useFeaturedItems() {
  return useQuery<ServiceItem[]>({
    queryKey: ['items', 'featured'],
    queryFn: () => api.get('/catalog/items/featured').then((r) => r.data.data),
  })
}

export function useServiceItem(code: string) {
  return useQuery<ServiceItem>({
    queryKey: ['item', code],
    queryFn: () => api.get(`/catalog/items/${code}`).then((r) => r.data.data),
    enabled: !!code,
  })
}

export function useProduct(code: string) {
  return useQuery({
    queryKey: ['product', code],
    queryFn: () => api.get(`/catalog/products/${code}`).then((r) => r.data.data),
    enabled: !!code,
  })
}
