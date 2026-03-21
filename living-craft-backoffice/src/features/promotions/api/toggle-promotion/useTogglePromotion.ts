import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PromotionAdmin } from '@/shared/types/api'

/**
 * 프로모션 활성/비활성 토글 API
 */
const togglePromotion = async (
  id: number | string
): Promise<ApiResponse<PromotionAdmin>> => {
  const { data } = await axiosInstance.post<PromotionAdmin>(
    ADMIN_API.PROMOTIONS.TOGGLE(id)
  )
  return data
}

/**
 * 프로모션 활성/비활성 토글
 *
 * POST /api/admin/promotions/:id/toggle
 */
export function useTogglePromotion() {
  const queryClient = useQueryClient()

  return useStandardMutation<PromotionAdmin, Error, number | string>({
    mutationFn: togglePromotion,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST)],
      })
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST),
          'detail',
          id,
        ],
      })
    },
  })
}
