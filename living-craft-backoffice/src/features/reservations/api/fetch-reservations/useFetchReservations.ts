import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { FetchReservationsResponse } from './types'

/**
 * 예약 목록 조회 API
 */
const fetchReservations = async (): Promise<
  ApiResponse<FetchReservationsResponse>
> => {
  const { data } = await axiosInstance.get<FetchReservationsResponse>(
    ADMIN_API.RESERVATIONS.LIST
  )
  return data
}

/**
 * 예약 목록 조회
 *
 * GET /api/admin/reservations
 */
export function useFetchReservations() {
  return useStandardQuery<FetchReservationsResponse>({
    queryKey: [...generateQueryKeysFromUrl(ADMIN_API.RESERVATIONS.LIST)],
    queryFn: fetchReservations,
  })
}
