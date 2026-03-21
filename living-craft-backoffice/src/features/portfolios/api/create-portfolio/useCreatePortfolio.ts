import { useQueryClient } from '@tanstack/react-query'
import { axiosInstance, ADMIN_API, type ApiResponse } from '@/shared/api'
import { useStandardMutation } from '@/shared/hooks/custom-query'
import { generateQueryKeysFromUrl } from '@/shared/lib'
import type { PortfolioAdmin, CreatePortfolioRequest } from '@/shared/types/api'
import { toast } from 'sonner'

export interface CreatePortfolioVariables extends CreatePortfolioRequest {
  images: File[]
}

/**
 * 포트폴리오 생성 API
 */
const createPortfolio = async (
  request: CreatePortfolioVariables
): Promise<ApiResponse<PortfolioAdmin>> => {
  const formData = new FormData()

  formData.append('category', request.category)
  formData.append('projectName', request.projectName)
  if (request.client) formData.append('client', request.client)
  formData.append('duration', request.duration)
  formData.append('description', request.description)
  formData.append('detailedDescription', request.detailedDescription)
  formData.append('relatedServiceId', String(request.relatedServiceId))

  if (request.tags && request.tags.length > 0) {
    request.tags.forEach((tag) => formData.append('tags', tag))
  }

  request.images.forEach((file) => {
    formData.append('images', file)
  })

  const { data } = await axiosInstance.post<PortfolioAdmin>(
    ADMIN_API.PORTFOLIOS.CREATE,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

/**
 * 포트폴리오 생성
 *
 * POST /api/admin/portfolios (multipart/form-data)
 */
export function useCreatePortfolio() {
  const queryClient = useQueryClient()

  return useStandardMutation<PortfolioAdmin, Error, CreatePortfolioVariables>({
    mutationFn: createPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...generateQueryKeysFromUrl(ADMIN_API.PORTFOLIOS.LIST)],
      })
      toast.success('포트폴리오가 생성되었습니다.')
    },
  })
}
