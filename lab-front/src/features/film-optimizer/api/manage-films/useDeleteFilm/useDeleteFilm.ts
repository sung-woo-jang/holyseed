import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 필름지 삭제 API
 */
const deleteFilm = async (id: number | string): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.FILM_OPTIMIZER.FILMS.DELETE(id)
  )
  return data
}

/**
 * 필름지 삭제
 *
 * POST /api/admin/film-optimizer/films/:id/delete
 */
export function useDeleteFilm() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, number | string>({
    mutationFn: deleteFilm,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.FILM_OPTIMIZER.FILMS.LIST),
        ],
      })
      toast.success('필름지가 삭제되었습니다.')
    },
  })
}
