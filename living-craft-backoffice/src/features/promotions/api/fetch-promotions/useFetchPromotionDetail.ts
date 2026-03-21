import { axiosInstance, ADMIN_API } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PromotionAdmin } from '@/shared/types/api'

/**
 * Fetch promotion detail
 */
async function fetchPromotionDetail(id: number | string) {
  const { data } = await axiosInstance.get<PromotionAdmin>(
    ADMIN_API.PROMOTIONS.DETAIL(id)
  )
  return data
}

/**
 * 프로모션 상세 조회
 * GET /api/admin/promotions/:id
 */
export function useFetchPromotionDetail(id: number | string | undefined) {
  return useStandardQuery<PromotionAdmin>({
    queryKey: [
      ...generateQueryKeysFromUrl(ADMIN_API.PROMOTIONS.LIST),
      'detail',
      id,
    ],
    queryFn: () => {
      if (!id) throw new Error('프로모션 ID가 필요합니다.')
      return fetchPromotionDetail(id)
    },
    enabled: !!id,
  })
}
