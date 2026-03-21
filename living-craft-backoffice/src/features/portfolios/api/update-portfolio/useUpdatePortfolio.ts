import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PortfolioAdmin, UpdatePortfolioRequest } from '@/shared/types/api'
import { toast } from 'sonner'

export interface UpdatePortfolioVariables {
  id: string
  data: UpdatePortfolioRequest & {
    newImages?: File[]
  }
}

/**
 * 포트폴리오 수정 API
 */
const updatePortfolio = async ({
  id,
  data: request,
}: UpdatePortfolioVariables): Promise<ApiResponse<PortfolioAdmin>> => {
  const formData = new FormData()

  if (request.category) formData.append('category', request.category)
  if (request.projectName) formData.append('projectName', request.projectName)
  if (request.client !== undefined) formData.append('client', request.client)
  if (request.duration) formData.append('duration', request.duration)
  if (request.description) formData.append('description', request.description)
  if (request.detailedDescription) {
    formData.append('detailedDescription', request.detailedDescription)
  }
  if (request.relatedServiceId) {
    formData.append('relatedServiceId', String(request.relatedServiceId))
  }

  if (request.tags && request.tags.length > 0) {
    request.tags.forEach((tag) => formData.append('tags', tag))
  }

  // 새 이미지가 있으면 추가
  if (request.newImages && request.newImages.length > 0) {
    request.newImages.forEach((file) => {
      formData.append('images', file)
    })
  }

  const { data } = await axiosInstance.post<PortfolioAdmin>(
    ADMIN_API.PORTFOLIOS.UPDATE(id),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

/**
 * 포트폴리오 수정
 *
 * POST /api/admin/portfolios/:id (multipart/form-data)
 */
export function useUpdatePortfolio() {
  const queryClient = useQueryClient()

  return useStandardMutation<PortfolioAdmin, Error, UpdatePortfolioVariables>({
    mutationFn: updatePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PORTFOLIOS.LIST)],
      })
      toast.success('포트폴리오가 수정되었습니다.')
    },
  })
}
