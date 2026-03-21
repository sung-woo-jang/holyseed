import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { CreateServiceRequest } from './types'

/**
 * 서비스 생성 API
 */
const createService = async (
  request: CreateServiceRequest
): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.SERVICES.CREATE,
    request
  )
  return data
}

/**
 * 서비스 생성
 *
 * POST /api/services/admin
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, CreateServiceRequest>({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.SERVICES.LIST)],
      })
      toast.success('서비스가 생성되었습니다.')
    },
  })
}
