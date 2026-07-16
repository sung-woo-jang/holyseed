import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { PieceActionVariables } from '../types'

const deletePiece = async ({
  projectId,
  pieceId,
}: PieceActionVariables): Promise<ApiResponse<void>> => {
  const { data } = await axiosInstance.post<void>(
    ADMIN_API.FILM_OPTIMIZER.PIECES.DELETE(projectId, pieceId)
  )
  return data
}

export function useDeletePiece() {
  const queryClient = useQueryClient()

  const mutation = useStandardMutation<void, Error, PieceActionVariables>({
    mutationFn: deletePiece,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(
            ADMIN_API.FILM_OPTIMIZER.PROJECTS.DETAIL(variables.projectId)
          ),
        ],
      })
      toast.success('재단 조각이 삭제되었습니다.')
    },
  })

  return {
    ...mutation,
    mutateAsync: async (variables: PieceActionVariables) => {
      const result = await mutation.mutateAsync(variables)
      return result.data
    },
  }
}
