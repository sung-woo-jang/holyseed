/**
 * API 응답 타입 정의
 */

export interface ApiResponse<T> {
  success: true
  message: string
  data: T
  timestamp: string
}

export interface ErrorResponse {
  success: false
  error: string
  message: string
  statusCode: number
  timestamp: string
  path: string
}

// 페이지네이션 응답용
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
