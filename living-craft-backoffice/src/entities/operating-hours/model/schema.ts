import { z } from 'zod'

/**
 * 요일 타입
 */
export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

/**
 * 시간 슬롯 스키마
 */
export const timeSlotSchema = z.object({
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, '올바른 시간 형식이 아닙니다 (HH:mm)'),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, '올바른 시간 형식이 아닙니다 (HH:mm)'),
  interval: z.number().min(30, '최소 30분 이상이어야 합니다'),
})

export type TimeSlot = z.infer<typeof timeSlotSchema>

/**
 * 운영 시간 스키마
 */
export const operatingHoursSchema = z.object({
  estimateSlots: z.record(dayOfWeekSchema, timeSlotSchema.optional()),
  constructionSlots: z.record(dayOfWeekSchema, timeSlotSchema.optional()),
})

export type OperatingHours = z.infer<typeof operatingHoursSchema>

/**
 * 휴무일 스키마
 */
export const holidaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
  reason: z.string().min(1, '휴무 사유를 입력해주세요'),
  createdAt: z.string(),
})

export type Holiday = z.infer<typeof holidaySchema>

/**
 * 휴무일 추가 폼 스키마
 */
export const holidayFormSchema = z.object({
  date: z.date({ message: '날짜를 선택해주세요' }),
  reason: z.string().min(1, '휴무 사유를 입력해주세요'),
})

export type HolidayForm = z.infer<typeof holidayFormSchema>
