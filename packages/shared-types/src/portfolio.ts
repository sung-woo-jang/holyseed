export interface Portfolio {
  id: string
  serviceId: string
  title: string
  description: string
  images: string[]
  category: string
  createdAt: string
  updatedAt: string
}

export interface CreatePortfolioRequest {
  serviceId: string
  title: string
  description: string
  images: string[]
  category: string
}

export interface UpdatePortfolioRequest {
  serviceId?: string
  title?: string
  description?: string
  images?: string[]
  category?: string
}

export interface PortfolioListResponse {
  portfolios: Portfolio[]
  total: number
  page: number
  limit: number
}

export interface PortfolioDetailResponse {
  portfolio: Portfolio
}
