import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { FetchPortfoliosResponse, PortfolioListResponse } from './types'

/**
 * 포트폴리오 목록 조회 API
 */
const fetchPortfolios = async (): Promise<ApiResponse<FetchPortfoliosResponse>> => {
  const { data } = await axiosInstance.get<PortfolioListResponse>(
    ADMIN_API.PORTFOLIOS.LIST
  )
  // API 응답 구조를 items 배열로 변환
  return {
    ...data,
    data: data.data.items,
  }
}

/**
 * 포트폴리오 목록 조회
 *
 * GET /api/admin/portfolios
 */
export function useFetchPortfolios() {
  return useStandardQuery<FetchPortfoliosResponse>({
    queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PORTFOLIOS.LIST)],
    queryFn: fetchPortfolios,
  })
}
