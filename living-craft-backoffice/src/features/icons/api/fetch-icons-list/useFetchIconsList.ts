import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl, createQueryString } from '@/shared/lib'
import type { FetchIconsListParams, FetchIconsListResponse } from './types'

const fetchIconsList = async (
  params?: FetchIconsListParams
): Promise<ApiResponse<FetchIconsListResponse>> => {
  const queryString = createQueryString(params as Record<string, unknown>)
  const url = `${ADMIN_API.ICONS.LIST}${queryString}`

  const { data } = await axiosInstance.get<FetchIconsListResponse>(url)
  return data
}

/**
 * 아이콘 목록 조회
 *
 * GET /api/icons
 *
 * @param params - 필터링 파라미터 (type, search)
 */
export function useFetchIconsList(params?: FetchIconsListParams) {
  const queryString = createQueryString(params as Record<string, unknown>)
  const url = ADMIN_API.ICONS.LIST + queryString

  return useStandardQuery<FetchIconsListResponse>({
    queryKey: [...generateQueryKeysFromUrl(url), params],
    queryFn: () => fetchIconsList(params),
    staleTime: 60 * 1000, // 1분 캐싱
  })
}
