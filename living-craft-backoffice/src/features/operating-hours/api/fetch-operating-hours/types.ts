/**
 * 요일
 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

/**
 * 시간대
 */
export interface TimeSlot {
  startTime: string // HH:mm
  endTime: string // HH:mm
  interval: number // 분 단위 (30, 60, 120)
}

/**
 * 운영 시간 설정
 */
export interface OperatingHours {
  estimateSlots: {
    [key in DayOfWeek]?: TimeSlot
  }
  constructionSlots: {
    [key in DayOfWeek]?: TimeSlot
  }
}

/**
 * 휴무일
 */
export interface Holiday {
  date: string // YYYY-MM-DD
  reason: string
  createdAt: string
}
