/**
 * 아이콘 타입
 */
export type IconType = 'FILL' | 'MONO' | 'COLOR'

/**
 * 아이콘 정보
 */
export interface IconItem {
  id: number
  name: string
  type: IconType
}

/**
 * 아이콘 조회 파라미터
 */
export interface FetchIconsParams extends Record<string, unknown> {
  type?: IconType
  search?: string
}

/**
 * 아이콘 조회 응답 (페이지네이션)
 */
export interface FetchIconsResponse {
  items: IconItem[]
  total: number
  count: number
  limit: number
  offset: number
}

/**
 * 아이콘 생성 요청
 */
export interface CreateIconRequest {
  name: string
  type: IconType
}

/**
 * 아이콘 생성 응답
 */
export type CreateIconResponse = IconItem
