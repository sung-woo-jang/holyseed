import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PromotionAdmin, UpdatePromotionRequest } from '@/shared/types/api'
import { toast } from 'sonner'

export interface UpdatePromotionVariables {
  id: number | string
  data: UpdatePromotionRequest
}

/**
 * 프로모션 수정 API
 */
const updatePromotion = async (
  request: UpdatePromotionVariables
): Promise<ApiResponse<PromotionAdmin>> => {
  const { data } = await axiosInstance.post<PromotionAdmin>(
    ADMIN_API.PROMOTIONS.UPDATE(request.id),
    request.data
  )
  return data
}

/**
 * 프로모션 수정
 *
 * POST /api/admin/promotions/:id/update (JSON)
 */
export function useUpdatePromotion() {
  const queryClient = useQueryClient()

  return useStandardMutation<PromotionAdmin, Error, UpdatePromotionVariables>({
    mutationFn: updatePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST)],
      })
      toast.success('프로모션이 수정되었습니다.')
    },
  })
}
