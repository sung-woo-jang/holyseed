import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { FetchReviewsResponse } from './types'

/**
 * 리뷰 목록 조회 API
 */
const fetchReviews = async (): Promise<ApiResponse<FetchReviewsResponse>> => {
  const { data } = await axiosInstance.get<FetchReviewsResponse>(
    ADMIN_API.REVIEWS.LIST
  )
  return data
}

/**
 * 리뷰 목록 조회
 *
 * GET /api/admin/reviews
 */
export function useFetchReviews() {
  return useStandardQuery<FetchReviewsResponse>({
    queryKey: [...generateQueryKeysFromUrl(ADMIN_API.REVIEWS.LIST)],
    queryFn: fetchReviews,
  })
}
