import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { OperatingHours } from '../fetch-operating-hours'

/**
 * 운영 시간 수정 API
 */
const updateOperatingHours = async (
  request: OperatingHours
): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.SETTINGS.OPERATING_HOURS.UPDATE,
    request
  )
  return data
}

/**
 * 운영 시간 수정
 *
 * POST /api/admin/settings/operating-hours
 */
export function useUpdateOperatingHours() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, OperatingHours>({
    mutationFn: updateOperatingHours,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.SETTINGS.OPERATING_HOURS.GET),
        ],
      })
      toast.success('운영 시간이 저장되었습니다.')
    },
  })
}
