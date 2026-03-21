import { useEffect } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PortfolioAdmin } from '@/shared/types/api'

// ===== Zod 스키마 정의 =====

export const portfolioFormSchema = z.object({
  category: z
    .string()
    .min(1, '카테고리를 선택하세요')
    .max(50, '카테고리는 50자 이내로 입력하세요'),
  projectName: z
    .string()
    .min(1, '프로젝트명을 입력하세요')
    .max(200, '프로젝트명은 200자 이내로 입력하세요'),
  client: z.string().max(100, '고객사는 100자 이내로 입력하세요'),
  duration: z
    .string()
    .min(1, '작업 기간을 입력하세요')
    .max(50, '작업 기간은 50자 이내로 입력하세요'),
  description: z.string().min(1, '간단 설명을 입력하세요'),
  detailedDescription: z.string().min(1, '상세 설명을 입력하세요'),
  tags: z.array(z.string()),
  relatedServiceId: z.number().min(1, '관련 서비스를 선택하세요'),
  existingImages: z.array(z.string()),
  newImages: z.array(z.instanceof(File)),
})

export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>

// ===== 상수 =====

export const PORTFOLIO_CATEGORY_OPTIONS = [
  '주방',
  '싱크대',
  '가구',
  '문',
  '창틀',
  '기타',
] as const

export const DURATION_OPTIONS = [
  '반나절',
  '1일',
  '1-2일',
  '2일',
  '2-3일',
  '3일',
  '3일 이상',
] as const

// ===== 헬퍼 함수 =====

/** 폼 기본값 생성 */
function getDefaultFormValues(): PortfolioFormValues {
  return {
    category: '',
    projectName: '',
    client: '',
    duration: '',
    description: '',
    detailedDescription: '',
    tags: [],
    relatedServiceId: 0,
    existingImages: [],
    newImages: [],
  }
}

// ===== 페이지용 훅 =====

interface UsePortfolioFormPageOptions {
  portfolioDetail?: PortfolioAdmin
  isLoading?: boolean
}

/**
 * 포트폴리오 폼 페이지용 훅
 *
 * 생성/수정 페이지에서 사용합니다.
 */
export function usePortfolioFormPage({
  portfolioDetail,
  isLoading,
}: UsePortfolioFormPageOptions) {
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: getDefaultFormValues(),
    mode: 'onChange',
  })

  // portfolioDetail 변경 시 폼 상태 동기화
  useEffect(() => {
    if (isLoading) return

    if (portfolioDetail) {
      form.reset({
        category: portfolioDetail.category,
        projectName: portfolioDetail.projectName,
        client: portfolioDetail.client ?? '',
        duration: portfolioDetail.duration,
        description: portfolioDetail.description,
        detailedDescription: portfolioDetail.detailedDescription,
        tags: portfolioDetail.tags ?? [],
        relatedServiceId: portfolioDetail.serviceId,
        existingImages: portfolioDetail.images ?? [],
        newImages: [],
      })
    } else {
      form.reset(getDefaultFormValues())
    }
  }, [portfolioDetail, isLoading, form])

  return form
}
