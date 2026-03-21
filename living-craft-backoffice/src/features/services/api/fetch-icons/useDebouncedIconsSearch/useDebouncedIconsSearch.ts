import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import type { FetchIconsResponse } from '../types'

/**
 * 디바운스가 적용된 아이콘 검색
 *
 * @param search - 검색어
 * @param delay - 디바운스 지연 시간 (기본 300ms)
 */
export function useDebouncedIconsSearch(search: string, delay = 300) {
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [search, delay])

  return useQuery<ApiResponse<FetchIconsResponse>>({
    queryKey: ['admin', 'icons', 'search', debouncedSearch],
    queryFn: async (): Promise<ApiResponse<FetchIconsResponse>> => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        // 빈 ApiResponse 반환
        return {
          success: true,
          message: '',
          data: {
            items: [],
            total: 0,
            count: 0,
            limit: 100,
            offset: 0,
          },
          timestamp: new Date().toISOString(),
        }
      }

      const searchParams = new URLSearchParams()
      searchParams.append('search', debouncedSearch)

      const url = `${ADMIN_API.ICONS.LIST}?${searchParams.toString()}`
      const response = await axiosInstance.get(url)
      return response.data as ApiResponse<FetchIconsResponse>
    },
    staleTime: 30 * 1000, // 30초 캐싱
    enabled: debouncedSearch.length >= 2, // 2글자 이상일 때만 활성화
  })
}
