import type { PortfolioAdmin } from '@/shared/types/api'

export interface PortfolioListResponse {
  items: PortfolioAdmin[]
  total: number
}

export type FetchPortfoliosResponse = PortfolioAdmin[]
