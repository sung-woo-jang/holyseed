import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 프로모션 삭제 API
 */
const deletePromotion = async (
  id: number | string
): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.PROMOTIONS.DELETE(id)
  )
  return data
}

/**
 * 프로모션 삭제
 *
 * POST /api/admin/promotions/:id/delete
 */
export function useDeletePromotion() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, number | string>({
    mutationFn: deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST)],
      })
      toast.success('프로모션이 삭제되었습니다.')
    },
  })
}
