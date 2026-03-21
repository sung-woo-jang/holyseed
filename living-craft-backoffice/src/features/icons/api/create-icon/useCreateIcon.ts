import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { IconAdminListItem, CreateIconRequest } from '@/shared/types/api'
import { toast } from 'sonner'

/**
 * 아이콘 생성 API
 */
const createIcon = async (
  request: CreateIconRequest
): Promise<ApiResponse<IconAdminListItem>> => {
  const { data } = await axiosInstance.post<IconAdminListItem>(
    ADMIN_API.ICONS.CREATE,
    request
  )
  return data
}

/**
 * 아이콘 생성
 *
 * POST /api/admin/icons (JSON)
 */
export function useCreateIcon() {
  const queryClient = useQueryClient()

  return useStandardMutation<IconAdminListItem, Error, CreateIconRequest>({
    mutationFn: createIcon,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.ICONS.LIST)],
      })
      toast.success('아이콘이 생성되었습니다.')
    },
  })
}
