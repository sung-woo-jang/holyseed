import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { FetchServiceDetailResponse } from './types'

/**
 * 서비스 상세 조회 API
 */
const fetchServiceDetail = async (
  id: number | string
): Promise<ApiResponse<FetchServiceDetailResponse>> => {
  const { data } = await axiosInstance.get<FetchServiceDetailResponse>(
    ADMIN_API.SERVICES.DETAIL(id)
  )
  return data
}

/**
 * 서비스 상세 조회 (관리자용 - 수정 페이지용)
 * regions, schedule, icon 등 전체 정보 반환
 *
 * GET /api/services/admin/:id
 */
export function useFetchServiceDetail(id: number | string | undefined) {
  return useStandardQuery<FetchServiceDetailResponse>({
    queryKey: [
      ...generateQueryKeysFromUrl(ADMIN_API.SERVICES.DETAIL(id ?? '')),
    ],
    queryFn: () => {
      if (!id) throw new Error('서비스 ID가 필요합니다.')
      return fetchServiceDetail(id)
    },
    enabled: !!id,
  })
}
