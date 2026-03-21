import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 서비스 삭제 API
 */
const deleteService = async (id: string): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(ADMIN_API.SERVICES.DELETE(id))
  return data
}

/**
 * 서비스 삭제
 *
 * POST /api/services/admin/:id/delete
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SERVICES.LIST)],
      })
      toast.success('서비스가 삭제되었습니다.')
    },
  })
}
