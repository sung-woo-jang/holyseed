import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category, FullCatalog, ServiceItem } from '@/types'

export function useCatalog() {
  return useQuery<FullCatalog>({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/catalog/categories').then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useServiceItems(catCode?: string) {
  return useQuery<ServiceItem[]>({
    queryKey: ['items', catCode],
    queryFn: () => api.get('/catalog/items', { params: catCode ? { cat: catCode } : {} }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useFeaturedItems() {
  return useQuery<ServiceItem[]>({
    queryKey: ['items', 'featured'],
    queryFn: () => api.get('/catalog/items/featured').then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useServiceItem(code: string) {
  return useQuery<ServiceItem>({
    queryKey: ['item', code],
    queryFn: () => api.get(`/catalog/items/${code}`).then((r) => r.data.data),
    enabled: !!code,
    placeholderData: keepPreviousData,
  })
}

export function useProduct(code: string) {
  return useQuery({
    queryKey: ['product', code],
    queryFn: () => api.get(`/catalog/products/${code}`).then((r) => r.data.data),
    enabled: !!code,
    placeholderData: keepPreviousData,
  })
}

// ──────────────── Admin hooks ────────────────

export function useAdminCategories() {
  return useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.post('/catalog/admin/categories/list').then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useAdminCategory(code: string) {
  return useQuery<Category>({
    queryKey: ['admin-category', code],
    queryFn: () => api.get(`/catalog/admin/categories/${code}`).then((r) => r.data.data),
    enabled: !!code,
    placeholderData: keepPreviousData,
  })
}

export function useAdminItems(categoryCode?: string) {
  return useQuery<ServiceItem[]>({
    queryKey: ['admin-items', categoryCode ?? 'all'],
    queryFn: () => api.post('/catalog/admin/items/list', { categoryCode }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useAdminItem(code: string) {
  return useQuery({
    queryKey: ['admin-item', code],
    queryFn: () => api.get(`/catalog/admin/items/${code}`).then((r) => r.data.data),
    enabled: !!code,
    placeholderData: keepPreviousData,
  })
}

export function useAdminProducts(opts?: { itemCode?: string; search?: string }) {
  return useQuery({
    queryKey: ['admin-products', opts?.itemCode ?? '', opts?.search ?? ''],
    queryFn: () => api.post('/catalog/admin/products/list', opts ?? {}).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useAdminProduct(code: string) {
  return useQuery({
    queryKey: ['admin-product', code],
    queryFn: () => api.get(`/catalog/admin/products/${code}`).then((r) => r.data.data),
    enabled: !!code,
    placeholderData: keepPreviousData,
  })
}

export function useInvalidateCatalog() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['catalog'] }),
      qc.invalidateQueries({ queryKey: ['categories'] }),
      qc.invalidateQueries({ queryKey: ['admin-categories'] }),
      qc.invalidateQueries({ queryKey: ['admin-items'] }),
      qc.invalidateQueries({ queryKey: ['admin-products'] }),
      qc.invalidateQueries({ queryKey: ['items'] }),
    ])
}
