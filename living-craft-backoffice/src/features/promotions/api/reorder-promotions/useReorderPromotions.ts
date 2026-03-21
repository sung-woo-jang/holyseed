import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type {
  PromotionAdmin,
  ReorderPromotionsRequest,
} from '@/shared/types/api'
import { toast } from 'sonner'

/**
 * 프로모션 정렬 순서 변경 API
 */
const reorderPromotions = async (
  request: ReorderPromotionsRequest
): Promise<ApiResponse<PromotionAdmin[]>> => {
  const { data } = await axiosInstance.post<PromotionAdmin[]>(
    ADMIN_API.PROMOTIONS.REORDER,
    request
  )
  return data
}

/**
 * 프로모션 정렬 순서 변경
 *
 * POST /api/admin/promotions/reorder
 */
export function useReorderPromotions() {
  const queryClient = useQueryClient()

  return useStandardMutation<PromotionAdmin[], Error, ReorderPromotionsRequest>(
    {
      mutationFn: reorderPromotions,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST)],
        })
        toast.success('정렬 순서가 변경되었습니다.')
      },
    }
  )
}
