import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { CuttingPiece } from '../../fetch-cutting-projects'
import type { TogglePieceCompleteVariables } from '../types'

const togglePieceComplete = async ({
  projectId,
  pieceId,
  data,
}: TogglePieceCompleteVariables): Promise<ApiResponse<CuttingPiece>> => {
  const { data: responseData } = await axiosInstance.post<CuttingPiece>(
    ADMIN_API.FILM_OPTIMIZER.PIECES.TOGGLE_COMPLETE(projectId, pieceId),
    data ?? {}
  )
  return responseData
}

export function useTogglePieceComplete() {
  const queryClient = useQueryClient()

  const mutation = useStandardMutation<
    CuttingPiece,
    Error,
    TogglePieceCompleteVariables
  >({
    mutationFn: togglePieceComplete,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(
            ADMIN_API.FILM_OPTIMIZER.PROJECTS.DETAIL(variables.projectId)
          ),
        ],
      })
    },
  })

  return {
    ...mutation,
    mutateAsync: async (variables: TogglePieceCompleteVariables) => {
      const result = await mutation.mutateAsync(variables)
      return result.data
    },
  }
}
