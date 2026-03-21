/**
 * 행정구역 레벨
 */
export type DistrictLevel = 'SIDO' | 'SIGUNGU' | 'EUPMYEONDONG'

/**
 * 행정구역 정보
 */
export interface District {
  id: number
  code: string
  name: string
  fullName: string
  level: DistrictLevel
  parentId: number | null
}

/**
 * 행정구역 조회 파라미터
 */
export interface FetchDistrictsParams extends Record<string, unknown> {
  level?: DistrictLevel
  parentId?: number
}

export type FetchDistrictsResponse = District[]
