import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { DashboardStats } from './types'

/**
 * 대시보드 통계 조회 API
 */
const fetchDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  const { data } = await axiosInstance.get<DashboardStats>(
    ADMIN_API.DASHBOARD.STATS
  )
  return data
}

/**
 * 대시보드 통계 데이터 조회
 * 5초마다 자동 갱신
 *
 * GET /api/admin/dashboard/stats
 */
export function useFetchDashboardStats() {
  return useStandardQuery<DashboardStats>({
    queryKey: generateQueryKeysFromUrl(ADMIN_API.DASHBOARD.STATS),
    queryFn: fetchDashboardStats,
    refetchInterval: 5000, // 5초마다 자동 갱신
  })
}
