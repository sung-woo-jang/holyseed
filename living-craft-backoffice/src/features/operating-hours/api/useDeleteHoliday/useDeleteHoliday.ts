import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

/**
 * 휴무일 삭제 API
 */
const deleteHoliday = async (date: string): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.SETTINGS.HOLIDAYS.DELETE(date)
  )
  return data
}

/**
 * 휴무일 삭제
 *
 * POST /api/admin/settings/holidays/:date/delete
 */
export function useDeleteHoliday() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, string>({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.SETTINGS.HOLIDAYS.LIST),
        ],
      })
      toast.success('휴무일이 삭제되었습니다.')
    },
  })
}
