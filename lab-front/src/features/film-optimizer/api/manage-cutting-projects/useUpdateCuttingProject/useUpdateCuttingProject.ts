import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { CuttingProjectDetail } from '../../fetch-cutting-projects'
import type { UpdateCuttingProjectVariables } from '../types'

const updateCuttingProject = async ({
  id,
  data: requestData,
}: UpdateCuttingProjectVariables): Promise<
  ApiResponse<CuttingProjectDetail>
> => {
  const { data } = await axiosInstance.post<CuttingProjectDetail>(
    ADMIN_API.FILM_OPTIMIZER.PROJECTS.UPDATE(id),
    requestData
  )
  return data
}

export function useUpdateCuttingProject() {
  const queryClient = useQueryClient()

  const mutation = useStandardMutation<
    CuttingProjectDetail,
    Error,
    UpdateCuttingProjectVariables
  >({
    mutationFn: updateCuttingProject,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.FILM_OPTIMIZER.PROJECTS.LIST),
        ],
      })
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(
            ADMIN_API.FILM_OPTIMIZER.PROJECTS.DETAIL(variables.id)
          ),
        ],
      })
      toast.success('재단 프로젝트가 수정되었습니다.')
    },
  })

  return {
    ...mutation,
    mutateAsync: async (variables: UpdateCuttingProjectVariables) => {
      const result = await mutation.mutateAsync(variables)
      return result.data
    },
  }
}
