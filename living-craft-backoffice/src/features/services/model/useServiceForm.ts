import { useEffect, useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Service, type ServiceAdminDetail } from '@/shared/types/api'
import { useFetchServicesList } from '../api'

/**
 * 서비스 폼 스키마
 *
 * Phase 4 변경사항:
 * - regions, schedule 필드 제거
 * - 전역 설정 사용으로 단순화
 */
export const serviceFormSchema = z.object({
  title: z
    .string()
    .min(1, '서비스명을 입력하세요')
    .max(100, '서비스명은 100자 이내로 입력하세요'),
  description: z.string().min(1, '설명을 입력하세요'),
  iconName: z.string().min(1, '아이콘 이름을 입력하세요'),
  iconBgColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요 (예: #3B82F6)')
    .optional()
    .or(z.literal('')),
  iconColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요 (예: #424242)')
    .optional()
    .or(z.literal('')),
  duration: z.string().min(1, '소요 시간을 입력하세요'),
  requiresTimeSelection: z.boolean(),
  sortOrder: z.number().min(1, '정렬 순서는 1 이상이어야 합니다'),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>

// ===== 헬퍼 함수 =====

/** 폼 기본값 생성 */
function getDefaultFormValues(sortOrder: number): ServiceFormValues {
  return {
    title: '',
    description: '',
    iconName: '',
    iconBgColor: '',
    iconColor: '',
    duration: '',
    requiresTimeSelection: false,
    sortOrder,
  }
}

// ===== 훅 =====

interface UseServiceFormOptions {
  service?: Service
  isOpen: boolean
}

export function useServiceForm({ service, isOpen }: UseServiceFormOptions) {
  const isEditMode = Boolean(service)

  // 서비스 목록 조회 (sortOrder 계산용)
  const { data: servicesApiResponse } = useFetchServicesList()
  const servicesData = servicesApiResponse?.data

  // 다음 sortOrder 계산
  const nextSortOrder = useMemo(() => {
    if (isEditMode && service) {
      return service.sortOrder || 1
    }
    // 신규 추가: 최대값 + 1 (최소 1)
    const services = servicesData ?? []
    const maxOrder = Math.max(...services.map((s) => s.sortOrder || 0), 0)
    return maxOrder + 1
  }, [servicesData, isEditMode, service])

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: getDefaultFormValues(1), // 초기값은 1 (useEffect에서 업데이트)
  })

  // 모달 열림/닫힘 및 service 변경 시 폼 상태 동기화
  useEffect(() => {
    if (!isOpen) {
      // 모달이 닫힐 때는 아무것도 하지 않음
      return
    }

    // 모달이 열릴 때
    if (service) {
      // 수정 모드: 서비스 데이터로 폼 리셋
      const iconName = service.icon?.name || service.iconName || ''

      form.reset({
        title: service.title,
        description: service.description,
        iconName,
        iconBgColor: service.iconBgColor ?? '',
        iconColor: service.iconColor ?? '',
        duration: service.duration,
        requiresTimeSelection: service.requiresTimeSelection,
        sortOrder: service.sortOrder,
      })
    } else {
      // 생성 모드: 기본값으로 폼 완전 초기화 (nextSortOrder 반영)
      form.reset(getDefaultFormValues(nextSortOrder))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, isOpen, nextSortOrder])

  return form
}

// ===== 페이지용 훅 (ServiceFormPage에서 사용) =====

interface UseServiceFormPageOptions {
  /** ServiceAdminDetail 데이터 (수정 모드일 때) */
  serviceDetail?: ServiceAdminDetail
  /** 데이터 로딩 여부 */
  isLoading?: boolean
}

/**
 * 서비스 폼 페이지용 훅
 * 모달과 달리 isOpen 상태가 필요 없고, ServiceAdminDetail 타입을 직접 사용
 */
export function useServiceFormPage({
  serviceDetail,
  isLoading,
}: UseServiceFormPageOptions) {
  const isEditMode = Boolean(serviceDetail)

  // 서비스 목록 조회 (sortOrder 계산용)
  const { data: servicesApiResponse2 } = useFetchServicesList()
  const servicesData2 = servicesApiResponse2?.data

  // 다음 sortOrder 계산
  const nextSortOrder = useMemo(() => {
    if (isEditMode && serviceDetail) {
      return serviceDetail.sortOrder || 1
    }
    // 신규 추가: 최대값 + 1 (최소 1)
    const services = servicesData2 ?? []
    const maxOrder = Math.max(...services.map((s) => s.sortOrder || 0), 0)
    return maxOrder + 1
  }, [servicesData2, isEditMode, serviceDetail])

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: getDefaultFormValues(1),
  })

  // serviceDetail 또는 nextSortOrder 변경 시 폼 상태 동기화
  useEffect(() => {
    // 로딩 중이면 대기
    if (isLoading) return

    if (serviceDetail) {
      // 수정 모드: 서비스 데이터로 폼 리셋
      const iconName = serviceDetail.icon?.name || ''

      form.reset({
        title: serviceDetail.title,
        description: serviceDetail.description,
        iconName,
        iconBgColor: serviceDetail.iconBgColor ?? '',
        iconColor: serviceDetail.iconColor ?? '',
        duration: serviceDetail.duration,
        requiresTimeSelection: serviceDetail.requiresTimeSelection,
        sortOrder: serviceDetail.sortOrder,
      })
    } else {
      // 생성 모드: 기본값으로 폼 초기화
      form.reset(getDefaultFormValues(nextSortOrder))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDetail, isLoading, nextSortOrder])

  return form
}
