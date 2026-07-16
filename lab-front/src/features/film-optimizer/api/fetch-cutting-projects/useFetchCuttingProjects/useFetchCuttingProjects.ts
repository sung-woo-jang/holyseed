import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardQuery } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { FetchCuttingProjectsResponse } from '../types'

/**
 * 재단 프로젝트 목록 조회 API
 */
const fetchCuttingProjects = async (
  filmId?: number | string
): Promise<ApiResponse<FetchCuttingProjectsResponse>> => {
  const params = filmId ? { filmId } : undefined
  const { data } = await axiosInstance.get<FetchCuttingProjectsResponse>(
    ADMIN_API.FILM_OPTIMIZER.PROJECTS.LIST,
    { params }
  )
  return data
}

/**
 * 재단 프로젝트 목록 조회
 *
 * GET /api/admin/film-optimizer/projects
 */
export function useFetchCuttingProjects(filmId?: number | string) {
  return useStandardQuery<
    FetchCuttingProjectsResponse,
    Error,
    FetchCuttingProjectsResponse
  >({
    queryKey: [
      ...generateQueryKeysFromUrl(ADMIN_API.FILM_OPTIMIZER.PROJECTS.LIST),
      filmId,
    ],
    queryFn: () => fetchCuttingProjects(filmId),
    select: (data) => data.data,
  })
}
