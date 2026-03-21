import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl, createQueryString } from '@/shared/lib'
import type { FetchIconsParams, FetchIconsResponse } from '../types'

/**
 * 아이콘 목록 조회 API
 */
const fetchIcons = async (
  params?: FetchIconsParams
): Promise<ApiResponse<FetchIconsResponse>> => {
  const searchParams = new URLSearchParams()

  if (params?.type) {
    searchParams.append('type', params.type)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }

  const url = `${ADMIN_API.ICONS.LIST}${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`

  const { data } = await axiosInstance.get<FetchIconsResponse>(url)
  return data
}

/**
 * 아이콘 목록 조회
 *
 * GET /api/icons
 *
 * @param params - 필터링 파라미터 (type, search)
 */
export function useFetchIcons(params?: FetchIconsParams) {
  const queryString = createQueryString(params)
  const url = ADMIN_API.ICONS.LIST + queryString

  return useStandardQuery<FetchIconsResponse>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: generateQueryKeysFromUrl(url),
    queryFn: () => fetchIcons(params),
    staleTime: 60 * 1000, // 1분 캐싱 (아이콘은 자주 변경되지 않음)
  })
}
