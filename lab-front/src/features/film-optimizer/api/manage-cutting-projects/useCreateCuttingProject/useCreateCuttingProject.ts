import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { CuttingProjectDetail } from '../../fetch-cutting-projects'
import type { CreateCuttingProjectRequest } from '../types'

const createCuttingProject = async (
  request: CreateCuttingProjectRequest
): Promise<ApiResponse<CuttingProjectDetail>> => {
  const { data } = await axiosInstance.post<CuttingProjectDetail>(
    ADMIN_API.FILM_OPTIMIZER.PROJECTS.CREATE,
    request
  )
  return data
}

export function useCreateCuttingProject() {
  const queryClient = useQueryClient()

  const mutation = useStandardMutation<
    CuttingProjectDetail,
    Error,
    CreateCuttingProjectRequest
  >({
    mutationFn: createCuttingProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.FILM_OPTIMIZER.PROJECTS.LIST),
        ],
      })
      toast.success('재단 프로젝트가 생성되었습니다.')
    },
  })

  return {
    ...mutation,
    mutateAsync: async (variables: CreateCuttingProjectRequest) => {
      const result = await mutation.mutateAsync(variables)
      return result.data
    },
  }
}
