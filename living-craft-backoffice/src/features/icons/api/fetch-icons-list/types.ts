import type {
  IconType,
  IconListPaginatedResponse,
} from '@/shared/types/api'

export interface FetchIconsListParams {
  search?: string
  type?: IconType
  limit?: number
  offset?: number
}

export type FetchIconsListResponse = IconListPaginatedResponse
