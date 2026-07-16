import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { CuttingProjectDetail } from '../types'

/**
 * 재단 프로젝트 상세 조회 API
 */
const fetchCuttingProjectDetail = async (
  id: number | string
): Promise<ApiResponse<CuttingProjectDetail>> => {
  const { data } = await axiosInstance.get<CuttingProjectDetail>(
    ADMIN_API.FILM_OPTIMIZER.PROJECTS.DETAIL(id)
  )
  return data
}

/**
 * 재단 프로젝트 상세 조회
 *
 * GET /api/admin/film-optimizer/projects/:id
 */
export function useFetchCuttingProjectDetail(id: number | string | undefined) {
  return useStandardQuery<CuttingProjectDetail, Error, CuttingProjectDetail>({
    queryKey: [
      ...generateQueryKeysFromUrl(
        ADMIN_API.FILM_OPTIMIZER.PROJECTS.DETAIL(id ?? '')
      ),
    ],
    queryFn: () => {
      if (!id) throw new Error('프로젝트 ID가 필요합니다.')
      return fetchCuttingProjectDetail(id)
    },
    enabled: !!id,
    select: (data) => data.data,
  })
}
