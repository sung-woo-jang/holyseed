import { useEffect, useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ScheduleMode,
  type DayCode,
  type Service,
  type ServiceAdminDetail,
  type ServiceSchedule,
  type ServiceScheduleAdmin,
} from '@/shared/types/api'
import { useFetchServicesList } from '../api'

// DayCode Zod 타입
const dayCodeSchema = z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])

/**
 * 스케줄 스키마 정의
 *
 * 견적 및 시공 일정 설정
 */
const scheduleSchema = z.object({
  // 견적 스케줄
  estimateScheduleMode: z.nativeEnum(ScheduleMode),
  estimateAvailableDays: z.array(dayCodeSchema).optional(),
  estimateStartTime: z.string().optional(),
  estimateEndTime: z.string().optional(),
  estimateSlotDuration: z.number().optional(),
  // 시공 스케줄
  constructionScheduleMode: z.nativeEnum(ScheduleMode),
  constructionAvailableDays: z.array(dayCodeSchema).optional(),
  constructionStartTime: z.string().optional(),
  constructionEndTime: z.string().optional(),
  constructionSlotDuration: z.number().optional(),
  // 예약 가능 기간
  bookingPeriodMonths: z.number().min(1).max(12),
})

// Zod 스키마 정의
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
  regions: z
    .array(
      z.object({
        districtId: z.number(),
        estimateFee: z.number().min(0, '출장비는 0 이상이어야 합니다'),
      })
    )
    .min(1, '최소 1개 이상의 지역을 선택해야 합니다'),
  schedule: scheduleSchema.optional(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>

// ===== 헬퍼 함수 및 상수 =====

/** 스케줄 기본값 */
const DEFAULT_SCHEDULE: NonNullable<ServiceFormValues['schedule']> = {
  // 견적 스케줄
  estimateScheduleMode: ScheduleMode.GLOBAL,
  estimateAvailableDays: [],
  estimateStartTime: '18:00',
  estimateEndTime: '22:00',
  estimateSlotDuration: 60,
  // 시공 스케줄
  constructionScheduleMode: ScheduleMode.GLOBAL,
  constructionAvailableDays: [],
  constructionStartTime: '09:00',
  constructionEndTime: '18:00',
  constructionSlotDuration: 60,
  // 예약 가능 기간
  bookingPeriodMonths: 3,
}

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
    regions: [],
    schedule: { ...DEFAULT_SCHEDULE },
  }
}

/** API 응답의 스케줄을 폼 값으로 변환 */
function transformScheduleFromApi(
  schedule: ServiceSchedule | ServiceScheduleAdmin | null | undefined
): NonNullable<ServiceFormValues['schedule']> {
  if (!schedule) {
    return { ...DEFAULT_SCHEDULE }
  }

  // 타입 가드를 사용하여 안전하게 속성 접근
  const sched = schedule as ServiceSchedule & ServiceScheduleAdmin

  return {
    // 견적 스케줄
    estimateScheduleMode:
      (sched.estimateScheduleMode as ScheduleMode) ?? ScheduleMode.GLOBAL,
    estimateAvailableDays: (sched.estimateAvailableDays as DayCode[]) ?? [],
    estimateStartTime: sched.estimateStartTime ?? '18:00',
    estimateEndTime: sched.estimateEndTime ?? '22:00',
    estimateSlotDuration: sched.estimateSlotDuration ?? 60,
    // 시공 스케줄
    constructionScheduleMode:
      (sched.constructionScheduleMode as ScheduleMode) ?? ScheduleMode.GLOBAL,
    constructionAvailableDays:
      (sched.constructionAvailableDays as DayCode[]) ?? [],
    constructionStartTime: sched.constructionStartTime ?? '09:00',
    constructionEndTime: sched.constructionEndTime ?? '18:00',
    constructionSlotDuration: sched.constructionSlotDuration ?? 60,
    // 예약 가능 기간
    bookingPeriodMonths: sched.bookingPeriodMonths ?? 3,
  }
}

/** 서비스의 regions를 폼 값으로 변환 (백엔드 응답 형태 지원) */
function transformRegionsFromApi(
  service: Service
): ServiceFormValues['regions'] {
  // 백엔드 serviceRegions 형태인 경우 (원본 응답)
  if (service.serviceRegions && service.serviceRegions.length > 0) {
    return service.serviceRegions.map((region) => ({
      districtId: region.district?.id ?? region.districtId,
      estimateFee:
        typeof region.estimateFee === 'string'
          ? parseInt(region.estimateFee) || 0
          : region.estimateFee || 0,
    }))
  }

  // 기존 serviceableRegions 형태인 경우 (변환된 데이터)
  if (service.serviceableRegions && service.serviceableRegions.length > 0) {
    return service.serviceableRegions.flatMap((region) =>
      region.cities.map((city) => ({
        districtId: parseInt(city.id),
        estimateFee: city.estimateFee ?? region.estimateFee,
      }))
    )
  }

  return []
}

/** ServiceAdminDetail의 regions를 폼 값으로 변환 */
function transformRegionsFromAdminDetail(
  service: ServiceAdminDetail
): ServiceFormValues['regions'] {
  // serviceRegions 필드 확인 (백엔드 실제 응답)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regions = (service as any).serviceRegions || service.regions

  if (!regions || regions.length === 0) {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return regions.map((region: any) => ({
    districtId: region.districtId,
    estimateFee:
      typeof region.estimateFee === 'string'
        ? parseInt(region.estimateFee) || 0
        : region.estimateFee || 0,
  }))
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
      // (다음 오픈 시 적절히 초기화됨)
      return
    }

    // 모달이 열릴 때
    if (service) {
      // 수정 모드: 서비스 데이터로 폼 리셋
      // icon 객체에서 name 추출 (백엔드 응답 지원)
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
        regions: transformRegionsFromApi(service),
        schedule: transformScheduleFromApi(service.schedule),
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
        regions: transformRegionsFromAdminDetail(serviceDetail),
        schedule: transformScheduleFromApi(serviceDetail.schedule),
      })
    } else {
      // 생성 모드: 기본값으로 폼 초기화
      form.reset(getDefaultFormValues(nextSortOrder))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDetail, isLoading, nextSortOrder])

  return form
}
