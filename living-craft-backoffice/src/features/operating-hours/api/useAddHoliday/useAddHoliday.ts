import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { AddHolidayRequest } from './types'

/**
 * 휴무일 추가 API
 */
const addHoliday = async (
  request: AddHolidayRequest
): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.SETTINGS.HOLIDAYS.CREATE,
    request
  )
  return data
}

/**
 * 휴무일 추가
 *
 * POST /api/admin/settings/holidays
 */
export function useAddHoliday() {
  const queryClient = useQueryClient()

  return useStandardMutation<void, Error, AddHolidayRequest>({
    mutationFn: addHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.SETTINGS.HOLIDAYS.LIST),
        ],
      })
      toast.success('휴무일이 추가되었습니다.')
    },
  })
}
