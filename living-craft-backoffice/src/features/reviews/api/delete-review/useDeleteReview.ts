import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 리뷰 삭제 API
 */
const deleteReview = async (id: string): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(ADMIN_API.REVIEWS.DELETE(id))
  return data
}

/**
 * 리뷰 삭제
 *
 * POST /api/admin/reviews/:id/delete
 */
export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, string>({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.REVIEWS.LIST)],
      })
      toast.success('리뷰가 삭제되었습니다.')
    },
  })
}
