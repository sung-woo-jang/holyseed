import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { IconAdminListItem, UpdateIconRequest } from '@/shared/types/api'
import { toast } from 'sonner'

export interface UpdateIconVariables {
  id: number | string
  data: UpdateIconRequest
}

/**
 * 아이콘 수정 API
 */
const updateIcon = async (
  request: UpdateIconVariables
): Promise<ApiResponse<IconAdminListItem>> => {
  const { data } = await axiosInstance.post<IconAdminListItem>(
    ADMIN_API.ICONS.UPDATE(request.id),
    request.data
  )
  return data
}

/**
 * 아이콘 수정
 *
 * POST /api/admin/icons/:id/update (JSON)
 */
export function useUpdateIcon() {
  const queryClient = useQueryClient()

  return useStandardMutation<IconAdminListItem, Error, UpdateIconVariables>({
    mutationFn: updateIcon,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.ICONS.LIST)],
      })
      toast.success('아이콘이 수정되었습니다.')
    },
  })
}
