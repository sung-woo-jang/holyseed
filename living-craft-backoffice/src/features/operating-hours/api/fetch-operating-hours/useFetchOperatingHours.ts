import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { OperatingHours, Holiday } from './types'

/**
 * 운영 시간 조회 API
 */
const fetchOperatingHours = async (): Promise<ApiResponse<OperatingHours>> => {
  const { data } = await axiosInstance.get<OperatingHours>(
    ADMIN_API.SETTINGS.OPERATING_HOURS.GET
  )
  return data
}

/**
 * 휴무일 목록 조회 API
 */
const fetchHolidays = async (): Promise<ApiResponse<Holiday[]>> => {
  const { data } = await axiosInstance.get<Holiday[]>(
    ADMIN_API.SETTINGS.HOLIDAYS.LIST
  )
  return data
}

/**
 * 운영 시간 조회
 *
 * GET /api/admin/settings/operating-hours
 */
export function useFetchOperatingHours() {
  return useStandardQuery<OperatingHours>({
    queryKey: [
      ...generateQueryKeysFromUrl(ADMIN_API.SETTINGS.OPERATING_HOURS.GET),
    ],
    queryFn: fetchOperatingHours,
  })
}

/**
 * 휴무일 목록 조회
 *
 * GET /api/admin/settings/holidays
 */
export function useFetchHolidays() {
  return useStandardQuery<Holiday[]>({
    queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SETTINGS.HOLIDAYS.LIST)],
    queryFn: fetchHolidays,
  })
}
