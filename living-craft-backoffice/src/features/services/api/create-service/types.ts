/**
 * 스케줄 모드
 */
export enum ScheduleMode {
  GLOBAL = 'global',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  EVERYDAY = 'everyday',
  CUSTOM = 'custom',
  EVERYDAY_EXCEPT = 'everyday_except',
}

/**
 * 요일 코드
 */
export type DayCode = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

/**
 * 서비스 지역 입력
 */
export interface ServiceRegionInput {
  districtId: number
  estimateFee: number
}

/**
 * 서비스 스케줄 입력 타입
 *
 * 견적 및 시공 일정을 설정합니다.
 */
export interface ServiceScheduleInput {
  // 견적 스케줄
  estimateScheduleMode: ScheduleMode
  estimateAvailableDays?: DayCode[]
  estimateStartTime?: string
  estimateEndTime?: string
  estimateSlotDuration?: number
  // 시공 스케줄
  constructionScheduleMode: ScheduleMode
  constructionAvailableDays?: DayCode[]
  constructionStartTime?: string
  constructionEndTime?: string
  constructionSlotDuration?: number
  // 예약 가능 기간
  bookingPeriodMonths?: number
}

/**
 * 서비스 생성 요청
 * POST /api/services/admin 요청
 */
export interface CreateServiceRequest {
  title: string
  description: string
  iconId: number
  iconBgColor?: string
  iconColor?: string
  duration: string
  requiresTimeSelection: boolean
  sortOrder?: number
  regions: ServiceRegionInput[]
  schedule?: ServiceScheduleInput
}
