import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { UpdateServiceOrderRequest } from './types'

/**
 * 서비스 순서 변경 API
 */
const updateServiceOrder = async (
  request: UpdateServiceOrderRequest
): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.SERVICES.ORDER,
    request
  )
  return data
}

/**
 * 서비스 순서 변경
 *
 * POST /api/services/admin/order
 */
export function useUpdateServiceOrder() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, UpdateServiceOrderRequest>({
    mutationFn: updateServiceOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SERVICES.LIST)],
      })
      toast.success('서비스 순서가 변경되었습니다.')
    },
    onError: () => {
      toast.error('순서 변경에 실패했습니다.')
    },
  })
}
