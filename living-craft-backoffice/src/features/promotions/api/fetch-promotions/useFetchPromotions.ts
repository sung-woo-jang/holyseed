import { axiosInstance, ADMIN_API } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PromotionAdmin } from '@/shared/types/api'

/**
 * Fetch promotions list
 */
async function fetchPromotions() {
  const { data } = await axiosInstance.get<PromotionAdmin[]>(
    ADMIN_API.PROMOTIONS.LIST
  )
  return data
}

/**
 * 프로모션 목록 조회
 * GET /api/admin/promotions
 */
export function useFetchPromotions() {
  return useStandardQuery<PromotionAdmin[]>({
    queryKey: generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST),
    queryFn: fetchPromotions,
  })
}
