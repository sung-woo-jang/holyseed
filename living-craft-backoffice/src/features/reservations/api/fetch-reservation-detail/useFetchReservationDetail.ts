import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { Reservation } from '../fetch-reservations'

/**
 * 예약 상세 조회 API
 */
const fetchReservationDetail = async (
  id: string
): Promise<ApiResponse<Reservation>> => {
  const { data } = await axiosInstance.get<Reservation>(
    ADMIN_API.RESERVATIONS.DETAIL(id)
  )
  return data
}

/**
 * 예약 상세 조회
 *
 * GET /api/admin/reservations/:id
 */
export function useFetchReservationDetail(id: string) {
  return useStandardQuery<Reservation>({
    queryKey: [...generateQueryKeysFromUrl(ADMIN_API.RESERVATIONS.DETAIL(id))],
    queryFn: () => fetchReservationDetail(id),
    enabled: !!id,
  })
}
