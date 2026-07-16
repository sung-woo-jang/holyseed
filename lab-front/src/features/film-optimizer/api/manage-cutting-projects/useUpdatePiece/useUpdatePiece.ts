import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import { toast } from 'sonner'
import type { CuttingPiece } from '../../fetch-cutting-projects'
import type { UpdatePieceVariables } from '../types'

const updatePiece = async ({
  projectId,
  pieceId,
  data: requestData,
}: UpdatePieceVariables): Promise<ApiResponse<CuttingPiece>> => {
  const { data } = await axiosInstance.post<CuttingPiece>(
    ADMIN_API.FILM_OPTIMIZER.PIECES.UPDATE(projectId, pieceId),
    requestData
  )
  return data
}

export function useUpdatePiece() {
  const queryClient = useQueryClient()

  return useStandardMutation<CuttingPiece, Error, UpdatePieceVariables>({
    mutationFn: updatePiece,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...generateQueryKeysFromUrl(
            ADMIN_API.FILM_OPTIMIZER.PROJECTS.DETAIL(variables.projectId)
          ),
        ],
      })
      toast.success('재단 조각이 수정되었습니다.')
    },
  })
}
