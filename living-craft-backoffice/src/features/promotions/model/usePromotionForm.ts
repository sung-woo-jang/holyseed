import { useEffect } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PromotionAdmin } from '@/shared/types/api'

// ===== Zod 스키마 정의 =====

export const promotionFormSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력하세요')
    .max(100, '제목은 100자 이내로 입력하세요'),
  subtitle: z.string().max(200, '부제목은 200자 이내로 입력하세요'),
  iconName: z.string().min(1, '아이콘을 선택하세요'),
  iconBgColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요'),
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요'),
  linkUrl: z.string(),
  linkType: z.enum(['external', 'internal']),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0, '정렬 순서는 0 이상이어야 합니다'),
})

export type PromotionFormValues = z.infer<typeof promotionFormSchema>

// ===== 상수 =====

export const LINK_TYPE_OPTIONS = [
  { value: 'external', label: '외부 링크' },
  { value: 'internal', label: '앱 내 이동' },
] as const

export const INTERNAL_LINK_OPTIONS = [
  { value: '/', label: '홈 (메인 페이지)' },
  { value: '/portfolio', label: '포트폴리오 목록' },
  { value: '/reservation/service', label: '예약 페이지 (서비스 선택)' },
  { value: '/reservation/datetime', label: '예약 페이지 (날짜/시간 선택)' },
  { value: '/reservation/customer', label: '예약 페이지 (정보 입력)' },
  { value: '/reservation/confirmation', label: '예약 페이지 (확인)' },
  { value: '/reviews', label: '리뷰 목록' },
  { value: '/my', label: '마이페이지' },
  { value: '/my/reservations', label: '내 예약 목록' },
  { value: '/my/reviews', label: '내 리뷰 목록' },
  { value: '__custom__', label: '직접 입력' },
] as const

/** 커스텀 URL인지 확인 (INTERNAL_LINK_OPTIONS에 없는 값) */
export function isCustomInternalUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return !INTERNAL_LINK_OPTIONS.some((opt) => opt.value === url)
}

// ===== 헬퍼 함수 =====

/** 폼 기본값 생성 */
function getDefaultFormValues(): PromotionFormValues {
  return {
    title: '',
    subtitle: '',
    iconName: '',
    iconBgColor: '#E3F2FD',
    iconColor: '#1976D2',
    linkUrl: '',
    linkType: 'external',
    startDate: '',
    endDate: '',
    isActive: true,
    sortOrder: 0,
  }
}

// ===== 페이지용 훅 =====

interface UsePromotionFormPageOptions {
  promotionDetail?: PromotionAdmin
  isLoading?: boolean
  nextSortOrder?: number
}

/**
 * 프로모션 폼 페이지용 훅
 *
 * 생성/수정 페이지에서 사용합니다.
 */
export function usePromotionFormPage({
  promotionDetail,
  isLoading,
  nextSortOrder = 0,
}: UsePromotionFormPageOptions) {
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      ...getDefaultFormValues(),
      sortOrder: nextSortOrder,
    },
  })

  // promotionDetail 변경 시 폼 상태 동기화
  useEffect(() => {
    if (isLoading) return

    if (promotionDetail) {
      form.reset({
        title: promotionDetail.title,
        subtitle: promotionDetail.subtitle ?? '',
        iconName: promotionDetail.icon?.name ?? '',
        iconBgColor: promotionDetail.iconBgColor,
        iconColor: promotionDetail.iconColor,
        linkUrl: promotionDetail.linkUrl ?? '',
        linkType: promotionDetail.linkType,
        startDate: promotionDetail.startDate
          ? promotionDetail.startDate.split('T')[0]
          : '',
        endDate: promotionDetail.endDate
          ? promotionDetail.endDate.split('T')[0]
          : '',
        isActive: promotionDetail.isActive,
        sortOrder: promotionDetail.sortOrder,
      })
    } else {
      form.reset({
        ...getDefaultFormValues(),
        sortOrder: nextSortOrder,
      })
    }
  }, [promotionDetail, isLoading, nextSortOrder, form])

  return form
}
