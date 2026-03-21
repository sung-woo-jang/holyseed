/**
 * 아이콘 타입
 */
export type IconType = 'FILL' | 'MONO' | 'COLOR'

/**
 * 아이콘 정보
 */
export interface Icon {
  id: number
  name: string
  type: IconType
}

/**
 * 관리자용 서비스 지역 (수정 페이지용)
 */
export interface ServiceRegionAdmin {
  districtId: number
  districtFullName: string
  districtName: string
  estimateFee: number
}

/**
 * 관리자용 서비스 스케줄 (수정 페이지용)
 */
export interface ServiceScheduleAdmin {
  estimateScheduleMode: string
  estimateAvailableDays: string[] | null
  estimateStartTime: string | null
  estimateEndTime: string | null
  estimateSlotDuration: number | null
  constructionScheduleMode: string
  constructionAvailableDays: string[] | null
  constructionStartTime: string | null
  constructionEndTime: string | null
  constructionSlotDuration: number | null
  bookingPeriodMonths: number
}

/**
 * 관리자용 서비스 상세 (수정 페이지용)
 * GET /api/services/admin/:id 응답
 */
export interface ServiceDetail {
  id: number
  title: string
  description: string
  icon: Icon
  iconBgColor: string
  iconColor: string
  duration: string
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  regions: ServiceRegionAdmin[]
  schedule: ServiceScheduleAdmin | null
  createdAt: string
  updatedAt: string
}

export type FetchServiceDetailResponse = ServiceDetail
