// ===== Query Hooks =====
export {
  useFetchOperatingHours,
  useFetchHolidays,
} from './fetch-operating-hours'

// ===== Mutation Hooks =====
export { useUpdateOperatingHours } from './useUpdateOperatingHours'
export { useAddHoliday } from './useAddHoliday'
export { useDeleteHoliday } from './useDeleteHoliday'

// ===== Query Keys =====

// ===== Types =====
export type {
  OperatingHours,
  Holiday,
  DayOfWeek,
  TimeSlot,
} from './fetch-operating-hours'

export type { AddHolidayRequest } from './useAddHoliday'
