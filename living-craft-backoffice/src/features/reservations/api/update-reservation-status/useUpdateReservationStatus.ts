import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { UpdateReservationStatusVariables } from './types'

/**
 * 예약 상태 변경 API
 */
const updateReservationStatus = async ({
  id,
  status,
}: UpdateReservationStatusVariables): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.RESERVATIONS.STATUS(id),
    { status }
  )
  return data
}

/**
 * 예약 상태 변경
 *
 * POST /api/admin/reservations/:id/status
 */
export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, UpdateReservationStatusVariables>({
    mutationFn: updateReservationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.RESERVATIONS.LIST)],
      })
      toast.success('예약 상태가 변경되었습니다.')
    },
  })
}
