import { z } from 'zod'

/**
 * Portfolio Entity Zod 스키마
 * API 응답 타입과 일치하도록 정의
 */

/**
 * 포트폴리오 카테고리 스키마
 */
export const portfolioCategorySchema = z.enum([
  '인테리어 필름',
  '유리 청소',
  '외부 유리',
  '내부 유리',
  '기타',
])

export type PortfolioCategory = z.infer<typeof portfolioCategorySchema>

/**
 * 포트폴리오 스키마
 */
export const portfolioSchema = z.object({
  id: z.string(),
  category: portfolioCategorySchema,
  projectName: z.string().min(1, '프로젝트명을 입력해주세요.'),
  clientName: z.string().min(1, '고객명을 입력해주세요.'),
  duration: z.string().min(1, '작업 기간을 입력해주세요.'),
  shortDescription: z.string().min(1, '간략한 설명을 입력해주세요.'),
  detailedDescription: z.string().min(1, '상세 설명을 입력해주세요.'),
  images: z
    .array(z.string())
    .min(1, '최소 1개 이상의 이미지를 업로드해주세요.'),
  tags: z.array(z.string()),
  relatedServiceIds: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Portfolio = z.infer<typeof portfolioSchema>

/**
 * 포트폴리오 생성/수정 폼 스키마
 */
export const portfolioFormSchema = z.object({
  category: portfolioCategorySchema,
  projectName: z.string().min(1, '프로젝트명을 입력해주세요.'),
  clientName: z.string().min(1, '고객명을 입력해주세요.'),
  duration: z.string().min(1, '작업 기간을 입력해주세요.'),
  shortDescription: z.string().min(1, '간략한 설명을 입력해주세요.'),
  detailedDescription: z.string().min(1, '상세 설명을 입력해주세요.'),
  images: z
    .array(z.string())
    .min(1, '최소 1개 이상의 이미지를 업로드해주세요.')
    .max(10, '최대 10개까지 업로드 가능합니다.'),
  tags: z.array(z.string()),
  relatedServiceIds: z.array(z.string()),
  isActive: z.boolean(),
})

export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>
