import { useEffect } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { IconAdminListItem, IconType } from '@/shared/types/api'

// ===== Zod 스키마 정의 =====

export const iconFormSchema = z.object({
  name: z
    .string()
    .min(1, '아이콘 이름을 입력하세요')
    .max(200, '아이콘 이름은 200자 이내로 입력하세요'),
  type: z.enum(['FILL', 'MONO', 'COLOR']),
})

export type IconFormValues = z.infer<typeof iconFormSchema>

// ===== 상수 =====

export const ICON_TYPE_OPTIONS: { value: IconType; label: string }[] = [
  { value: 'FILL', label: 'FILL' },
  { value: 'MONO', label: 'MONO' },
  { value: 'COLOR', label: 'COLOR' },
]

// ===== 헬퍼 함수 =====

/** 폼 기본값 생성 */
function getDefaultFormValues(): IconFormValues {
  return {
    name: '',
    type: 'MONO',
  }
}

// ===== 훅 =====

interface UseIconFormOptions {
  icon?: IconAdminListItem
  isOpen: boolean
}

/**
 * 아이콘 폼 훅 (Dialog용)
 *
 * 생성/수정 모드를 지원합니다.
 */
export function useIconForm({ icon, isOpen }: UseIconFormOptions) {
  const form = useForm<IconFormValues>({
    resolver: zodResolver(iconFormSchema),
    defaultValues: getDefaultFormValues(),
  })

  // 모달 열림/닫힘 및 icon 변경 시 폼 상태 동기화
  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (icon) {
      // 수정 모드: 아이콘 데이터로 폼 리셋
      form.reset({
        name: icon.name,
        type: icon.type,
      })
    } else {
      // 생성 모드: 기본값으로 폼 리셋
      form.reset(getDefaultFormValues())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icon, isOpen])

  return form
}
