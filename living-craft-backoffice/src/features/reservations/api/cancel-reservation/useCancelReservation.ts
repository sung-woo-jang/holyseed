import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { CancelReservationVariables } from './types'

/**
 * 예약 취소 API
 */
const cancelReservation = async ({
  id,
  reason,
}: CancelReservationVariables): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.RESERVATIONS.CANCEL(id),
    { reason }
  )
  return data
}

/**
 * 예약 취소
 *
 * POST /api/admin/reservations/:id/cancel
 */
export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, CancelReservationVariables>({
    mutationFn: cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.RESERVATIONS.LIST)],
      })
      toast.success('예약이 취소되었습니다.')
    },
  })
}
