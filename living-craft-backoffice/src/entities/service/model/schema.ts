import { z } from 'zod'

/**
 * Service Entity Zod 스키마
 * API 응답 타입과 일치하도록 정의
 */

/**
 * 출장비 정보 스키마
 */
export const travelFeeSchema = z.object({
  regionName: z.string(), // 지역명 (예: "서울특별시", "경기도 성남시")
  fee: z.number().min(0), // 출장비 (원)
})

export type TravelFee = z.infer<typeof travelFeeSchema>

/**
 * 서비스 스키마
 */
export const serviceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, '서비스 제목을 입력해주세요.'),
  description: z.string().min(1, '서비스 설명을 입력해주세요.'),
  iconName: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  estimatedDuration: z.number().min(1, '소요 시간을 입력해주세요.'),
  requiresTimeSelection: z.boolean(),
  serviceableRegions: z.array(z.string()),
  travelFees: z.array(travelFeeSchema),
  isActive: z.boolean(),
  displayOrder: z.number().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Service = z.infer<typeof serviceSchema>

/**
 * 서비스 생성/수정 폼 스키마
 */
export const serviceFormSchema = z.object({
  title: z.string().min(1, '서비스 제목을 입력해주세요.'),
  description: z.string().min(1, '서비스 설명을 입력해주세요.'),
  iconName: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  estimatedDuration: z.number().min(1, '소요 시간을 입력해주세요.'),
  requiresTimeSelection: z.boolean(),
  serviceableRegions: z
    .array(z.string())
    .min(1, '최소 1개 이상의 서비스 지역을 선택해주세요.'),
  travelFees: z.array(travelFeeSchema),
  isActive: z.boolean(),
  displayOrder: z.number().optional().nullable(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
