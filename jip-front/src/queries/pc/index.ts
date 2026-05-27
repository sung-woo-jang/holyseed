import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PcCategoryNode {
  id: number
  name: string
  parentId: number | null
  sortOrder: number
  children: PcCategoryNode[]
}

export interface PcVendor {
  id: number
  name: string
  contact?: string
  phone?: string
  email?: string
  homepage?: string
  memo?: string
  isActive: boolean
  sortOrder: number
}

export interface PcProductPrice {
  id: number
  productId: number
  vendorId: number
  price: number
  currency: string
  note?: string
  quotedAt?: string
  vendor?: PcVendor
}

export interface PcProductImage {
  id: number
  productId: number
  url: string
  isPrimary: boolean
  sortOrder: number
  role?: string
  label?: string
}

export interface PcProduct {
  id: number
  modelCode: string
  displayName: string
  categoryId: number
  brand?: string
  spec?: string
  unit: string
  description?: string
  note?: string
  primaryImageUrl?: string
  isActive: boolean
  code?: string | null
  serviceItemId?: number | null
  illustKind?: string
  sortOrder?: number
  representativePrice?: number | null
  category?: { id: number; name: string }
  prices?: PcProductPrice[]
  images?: PcProductImage[]
}

export interface PcImportResult {
  created: number
  updated: number
  skipped: number
  errors: Array<{ index: number; reason: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const wrap = <T>(res: { data: { data: T } }) => res.data.data

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const pcKeys = {
  categoryTree: () => ['pc-categories', 'tree'] as const,
  categoriesAll: () => ['pc-categories', 'all'] as const,
  vendorsAll: () => ['pc-vendors'] as const,
  productCompare: (categoryId: number | null) => ['pc-products', 'compare', categoryId] as const,
  productDetail: (id: number) => ['pc-products', id] as const,
  serviceItems: () => ['jip-service-items'] as const,
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const pcCategoriesApi = {
  tree: () => api.get('/pc/categories/tree').then(wrap<PcCategoryNode[]>),
  all: () => api.get('/pc/categories').then(wrap<PcCategoryNode[]>),
  create: (data: { parentId?: number; name: string; sortOrder?: number }) =>
    api.post('/pc/categories', data).then(wrap<PcCategoryNode>),
  update: (id: number, data: Partial<{ name: string; sortOrder: number; parentId: number }>) =>
    api.post(`/pc/categories/${id}/update`, data).then(wrap<PcCategoryNode>),
  delete: (id: number) => api.post(`/pc/categories/${id}/delete`),
  reorder: (items: { id: number; sortOrder: number }[]) =>
    api.post('/pc/categories/reorder', { items }),
}

export const pcVendorsApi = {
  all: () => api.get('/pc/vendors').then(wrap<PcVendor[]>),
  one: (id: number) => api.get(`/pc/vendors/${id}`).then(wrap<PcVendor>),
  create: (data: Partial<PcVendor>) => api.post('/pc/vendors', data).then(wrap<PcVendor>),
  update: (id: number, data: Partial<PcVendor>) =>
    api.post(`/pc/vendors/${id}/update`, data).then(wrap<PcVendor>),
  delete: (id: number) => api.post(`/pc/vendors/${id}/delete`),
}

export const pcProductsApi = {
  search: (params: {
    categoryId?: number
    includeDescendants?: boolean
    search?: string
    page?: number
    limit?: number
  }) =>
    api
      .post('/pc/products/search', params)
      .then(wrap<{ items: PcProduct[]; total: number; page: number; limit: number }>),

  compare: (categoryId: number, includeDescendants = true) =>
    api
      .post('/pc/products/compare', { categoryId, includeDescendants })
      .then(wrap<{ products: PcProduct[]; vendors: PcVendor[] }>),

  one: (id: number) => api.get(`/pc/products/${id}`).then(wrap<PcProduct>),

  create: (data: Partial<PcProduct>) => api.post('/pc/products', data).then(wrap<PcProduct>),

  update: (id: number, data: Partial<PcProduct>) =>
    api.post(`/pc/products/${id}/update`, data).then(wrap<PcProduct>),

  delete: (id: number) => api.post(`/pc/products/${id}/delete`),

  linkServiceItem: (
    productId: number,
    data: { serviceItemId?: number | null; code?: string | null; illustKind?: string; sortOrder?: number },
  ) => api.post(`/pc/products/${productId}/link-service-item`, data).then(wrap<PcProduct>),

  recomputePrice: (productId: number) =>
    api.post(`/pc/products/${productId}/recompute-price`, {}),

  import: (payload: {
    options?: { autoCreateCategory?: boolean; autoCreateVendor?: boolean; atomic?: boolean }
    items: Array<{
      categoryPath?: string[]
      modelCode: string
      displayName: string
      brand?: string
      spec?: string
      prices?: Array<{ vendor: string; price: number; note?: string }>
    }>
  }) => api.post('/pc/products/import', payload).then(wrap<PcImportResult>),

  uploadImage: (productId: number, file: File, isPrimary = false, sortOrder = 0) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('isPrimary', String(isPrimary))
    fd.append('sortOrder', String(sortOrder))
    return api
      .post(`/pc/products/${productId}/images/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(wrap<PcProductImage>)
  },

  setPrimaryImage: (productId: number, imageId: number) =>
    api.post(`/pc/products/${productId}/images/${imageId}/set-primary`),

  deleteImage: (productId: number, imageId: number) =>
    api.post(`/pc/products/${productId}/images/${imageId}/delete`),
}

export const pcPricesApi = {
  upsert: (data: {
    productId: number
    vendorId: number
    price: number
    currency?: string
    note?: string
    quotedAt?: string
  }) => api.post('/pc/prices', data).then(wrap<PcProductPrice>),

  delete: (id: number) => api.post(`/pc/prices/${id}/delete`),
}
