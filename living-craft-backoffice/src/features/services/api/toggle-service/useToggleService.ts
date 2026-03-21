import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 서비스 상태 토글 API
 */
const toggleService = async (id: string): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(ADMIN_API.SERVICES.TOGGLE(id))
  return data
}

/**
 * 서비스 활성/비활성 상태 토글
 *
 * POST /api/services/admin/:id/toggle
 */
export function useToggleService() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, string>({
    mutationFn: toggleService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SERVICES.LIST)],
      })
      toast.success('서비스 상태가 변경되었습니다.')
    },
  })
}
