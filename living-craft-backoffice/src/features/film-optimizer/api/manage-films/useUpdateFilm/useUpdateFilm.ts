import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { FilmDetail } from '../../fetch-films'
import type { UpdateFilmVariables } from '../types'

/**
 * 필름지 수정 API
 */
const updateFilm = async ({
  id,
  data: requestData,
}: UpdateFilmVariables): Promise<ApiResponse<FilmDetail>> => {
  const { data } = await axiosInstance.post<FilmDetail>(
    ADMIN_API.FILM_OPTIMIZER.FILMS.UPDATE(id),
    requestData
  )
  return data
}

/**
 * 필름지 수정
 *
 * POST /api/admin/film-optimizer/films/:id/update
 */
export function useUpdateFilm() {
  const queryClient = useQueryClient()

  return useStandardMutation<FilmDetail, Error, UpdateFilmVariables>({
    mutationFn: updateFilm,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.FILM_OPTIMIZER.FILMS.LIST),
        ],
      })
      toast.success('필름지가 수정되었습니다.')
    },
  })
}
