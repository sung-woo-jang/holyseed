import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { handleServerError } from '@/shared/lib/handle-server-error'
import { toast } from 'sonner'
import type { CreateIconRequest, CreateIconResponse } from '../types'

/**
 * 아이콘 생성 mutation
 */
export function useCreateIcon() {
  const queryClient = useQueryClient()

  return useMutation<CreateIconResponse, Error, CreateIconRequest>({
    mutationFn: async (data: CreateIconRequest) => {
      const response = await axiosInstance.post<
        ApiResponse<CreateIconResponse>
      >(ADMIN_API.ICONS.CREATE, data)
      return response.data.data as unknown as CreateIconResponse
    },
    onSuccess: () => {
      toast.success('아이콘이 생성되었습니다.')
      // 아이콘 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['admin', 'icons'] })
    },
    onError: (error) => {
      handleServerError(error)
    },
  })
}
