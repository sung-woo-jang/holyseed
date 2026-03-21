import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { UpdateServiceVariables } from './types'

/**
 * 서비스 수정 API
 */
const updateService = async ({
  id,
  data: requestData,
}: UpdateServiceVariables): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.SERVICES.UPDATE(id),
    requestData
  )
  return data
}

/**
 * 서비스 수정
 *
 * POST /api/services/admin/:id/update
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, UpdateServiceVariables>({
    mutationFn: updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SERVICES.LIST)],
      })
      toast.success('서비스가 수정되었습니다.')
    },
  })
}
