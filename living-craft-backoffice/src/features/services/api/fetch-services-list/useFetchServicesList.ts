import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { FetchServicesListResponse } from './types'

/**
 * 서비스 목록 조회 API
 * TypedAxiosInstance가 ApiResponse를 자동 래핑함
 */
const fetchServicesList = async (): Promise<
  ApiResponse<FetchServicesListResponse>
> => {
  const { data } = await axiosInstance.get<FetchServicesListResponse>(
    ADMIN_API.SERVICES.LIST
  )
  return data
}

/**
 * 서비스 목록 조회 (관리자용 - 간소화된 응답)
 * 테이블 표시에 필요한 최소 정보만 반환
 *
 * GET /api/services/admin
 */
export function useFetchServicesList() {
  return useStandardQuery<FetchServicesListResponse>({
    queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SERVICES.LIST)],
    queryFn: fetchServicesList,
  })
}
