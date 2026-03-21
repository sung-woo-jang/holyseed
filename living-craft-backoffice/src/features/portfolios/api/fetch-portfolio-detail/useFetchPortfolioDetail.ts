import { ADMIN_API, axiosInstance } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PortfolioAdmin } from '@/shared/types/api'

/**
 * 포트폴리오 상세 조회 API
 */
const fetchPortfolioDetail = async (id: string) => {
  const { data } = await axiosInstance.get<PortfolioAdmin>(
    ADMIN_API.PORTFOLIOS.DETAIL(id)
  )
  return data
}

/**
 * 포트폴리오 상세 조회
 *
 * GET /api/admin/portfolios/:id
 */
export function useFetchPortfolioDetail(id: string | undefined) {
  return useStandardQuery<PortfolioAdmin>({
    queryKey: [
      ...generateQueryKeysFromUrl(ADMIN_API.PORTFOLIOS.DETAIL(id ?? '')),
    ],
    queryFn: () => {
      if (!id) throw new Error('포트폴리오 ID가 필요합니다.')
      return fetchPortfolioDetail(id)
    },
    enabled: !!id,
  })
}
