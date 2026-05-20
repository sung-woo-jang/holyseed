import { api } from './api'

export interface CategoryNode {
  id: number
  name: string
  parentId: number | null
  sortOrder: number
  children: CategoryNode[]
}

export interface Vendor {
  id: number
  name: string
  contact?: string
  phone?: string
  email?: string
  homepage?: string
  memo?: string
  isActive: boolean
}

export interface ProductPrice {
  id: number
  productId: number
  vendorId: number
  price: number
  currency: string
  note?: string
  quotedAt?: string
  vendor?: Vendor
}

export interface ProductImage {
  id: number
  productId: number
  url: string
  isPrimary: boolean
  sortOrder: number
}

export interface Product {
  id: number
  modelCode: string
  displayName: string
  categoryId: number
  brand?: string
  spec?: string
  unit: string
  note?: string
  primaryImageUrl?: string
  isActive: boolean
  category?: { id: number; name: string }
  prices?: ProductPrice[]
  images?: ProductImage[]
}

const wrap = <T>(res: { data: { data: T } }) => res.data.data

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/pc/auth/login', { username, password }).then(wrap<{ accessToken: string; user: AuthUser }>),
}

interface AuthUser { id: number; username: string; displayName: string }

export const categoriesApi = {
  tree: () => api.get('/pc/categories/tree').then(wrap<CategoryNode[]>),
  all: () => api.get('/pc/categories').then(wrap<CategoryNode[]>),
  create: (data: { parentId?: number; name: string; sortOrder?: number }) =>
    api.post('/pc/categories', data).then(wrap<CategoryNode>),
  update: (id: number, data: Partial<{ name: string; sortOrder: number; parentId: number }>) =>
    api.post(`/pc/categories/${id}/update`, data).then(wrap<CategoryNode>),
  delete: (id: number) => api.post(`/pc/categories/${id}/delete`),
}

export const vendorsApi = {
  all: () => api.get('/pc/vendors').then(wrap<Vendor[]>),
  one: (id: number) => api.get(`/pc/vendors/${id}`).then(wrap<Vendor>),
  create: (data: Partial<Vendor>) => api.post('/pc/vendors', data).then(wrap<Vendor>),
  update: (id: number, data: Partial<Vendor>) =>
    api.post(`/pc/vendors/${id}/update`, data).then(wrap<Vendor>),
  delete: (id: number) => api.post(`/pc/vendors/${id}/delete`),
}

export const productsApi = {
  search: (params: {
    categoryId?: number
    includeDescendants?: boolean
    search?: string
    brand?: string
    isActive?: boolean
    page?: number
    limit?: number
  }) => api.post('/pc/products/search', params).then(wrap<{ items: Product[]; total: number; page: number; limit: number }>),

  compare: (categoryId: number, includeDescendants = true) =>
    api.post('/pc/products/compare', { categoryId, includeDescendants }).then(wrap<{ products: Product[]; vendors: Vendor[] }>),

  one: (id: number) => api.get(`/pc/products/${id}`).then(wrap<Product>),

  create: (data: Partial<Product>) => api.post('/pc/products', data).then(wrap<Product>),

  update: (id: number, data: Partial<Product>) =>
    api.post(`/pc/products/${id}/update`, data).then(wrap<Product>),

  delete: (id: number) => api.post(`/pc/products/${id}/delete`),

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
  }) => api.post('/pc/products/import', payload).then(wrap<{ created: number; updated: number; skipped: number; errors: Array<{ index: number; reason: string }> }>),

  uploadImage: (productId: number, file: File, isPrimary = false, sortOrder = 0) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('isPrimary', String(isPrimary))
    fd.append('sortOrder', String(sortOrder))
    return api.post(`/pc/products/${productId}/images/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(wrap<ProductImage>)
  },

  setPrimaryImage: (productId: number, imageId: number) =>
    api.post(`/pc/products/${productId}/images/${imageId}/set-primary`),

  deleteImage: (productId: number, imageId: number) =>
    api.post(`/pc/products/${productId}/images/${imageId}/delete`),
}

export const pricesApi = {
  upsert: (data: {
    productId: number
    vendorId: number
    price: number
    currency?: string
    note?: string
    quotedAt?: string
  }) => api.post('/pc/prices', data).then(wrap<ProductPrice>),

  delete: (id: number) => api.post(`/pc/prices/${id}/delete`),
}
