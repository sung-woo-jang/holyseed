import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PromotionAdmin, CreatePromotionRequest } from '@/shared/types/api'
import { toast } from 'sonner'

/**
 * 프로모션 생성 API
 */
const createPromotion = async (
  request: CreatePromotionRequest
): Promise<ApiResponse<PromotionAdmin>> => {
  const { data } = await axiosInstance.post<PromotionAdmin>(
    ADMIN_API.PROMOTIONS.CREATE,
    request
  )
  return data
}

/**
 * 프로모션 생성
 *
 * POST /api/admin/promotions (JSON)
 */
export function useCreatePromotion() {
  const queryClient = useQueryClient()

  return useStandardMutation<PromotionAdmin, Error, CreatePromotionRequest>({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST)],
      })
      toast.success('프로모션이 생성되었습니다.')
    },
  })
}
