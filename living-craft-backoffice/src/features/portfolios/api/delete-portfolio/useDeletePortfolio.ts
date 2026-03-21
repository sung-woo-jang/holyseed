import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 포트폴리오 삭제 API
 */
const deletePortfolio = async (id: string): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.PORTFOLIOS.DELETE(id)
  )
  return data
}

/**
 * 포트폴리오 삭제
 *
 * POST /api/admin/portfolios/:id/delete
 */
export function useDeletePortfolio() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, string>({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PORTFOLIOS.LIST)],
      })
      toast.success('포트폴리오가 삭제되었습니다.')
    },
  })
}
