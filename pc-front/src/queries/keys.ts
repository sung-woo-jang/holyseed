export const qk = {
  categoryTree: () => ['categories', 'tree'] as const,
  categoriesAll: () => ['categories', 'flat'] as const,
  vendorsAll: () => ['vendors'] as const,
  vendor: (id: number) => ['vendors', id] as const,
  productsSearch: (params: object) => ['products', 'search', params] as const,
  productDetail: (id: number) => ['products', id] as const,
  compare: (params: object) => ['compare', params] as const,
}
