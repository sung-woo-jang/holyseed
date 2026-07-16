import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'

const deleteCuttingProject = async (
  id: number | string
): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.FILM_OPTIMIZER.PROJECTS.DELETE(id)
  )
  return data
}

export function useDeleteCuttingProject() {
  const queryClient = useQueryClient()

  const mutation = useStandardMutation<void, Error, number | string>({
    mutationFn: deleteCuttingProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(ADMIN_API.FILM_OPTIMIZER.PROJECTS.LIST),
        ],
      })
      toast.success('재단 프로젝트가 삭제되었습니다.')
    },
  })

  return {
    ...mutation,
    mutateAsync: async (variables: number | string) => {
      const result = await mutation.mutateAsync(variables)
      return result.data
    },
  }
}
