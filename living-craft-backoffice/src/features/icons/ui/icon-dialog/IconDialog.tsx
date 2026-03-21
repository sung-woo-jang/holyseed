import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Field, FieldLabel, FieldError } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { IconAdminListItem } from '@/shared/types/api'
import { useCreateIcon, useUpdateIcon } from '../../api'
import { useIconForm, ICON_TYPE_OPTIONS } from '../../model'
import styles from './styles.module.scss'

interface IconDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  icon?: IconAdminListItem
  mode: 'create' | 'edit'
}

/**
 * 아이콘 생성/수정 Dialog 컴포넌트
 */
export function IconDialog({
  open,
  onOpenChange,
  icon,
  mode,
}: IconDialogProps) {
  const form = useIconForm({ icon, isOpen: open })
  const createIcon = useCreateIcon()
  const updateIcon = useUpdateIcon()

  const { control, handleSubmit } = form

  const isLoading = createIcon.isPending || updateIcon.isPending

  // Dialog가 닫힐 때 폼 리셋
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (mode === 'create') {
        await createIcon.mutateAsync(data)
      } else if (icon) {
        await updateIcon.mutateAsync({
          id: icon.id,
          data,
        })
      }
      onOpenChange(false)
    } catch {
      // 에러는 mutation hook에서 자동 처리 (toast)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '아이콘 추가' : '아이콘 수정'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '새로운 아이콘을 추가합니다.'
              : '아이콘 정보를 수정합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.content}>
            {/* 아이콘 이름 */}
            <Controller
              name='name'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='iconName'>아이콘 이름 *</FieldLabel>
                  <Input
                    {...field}
                    id='iconName'
                    placeholder='예: icon-account-fill'
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* 아이콘 타입 */}
            <Controller
              name='type'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='iconType'>아이콘 타입 *</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id='iconType'
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder='타입 선택' />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading
                ? mode === 'create'
                  ? '추가 중...'
                  : '수정 중...'
                : mode === 'create'
                  ? '추가'
                  : '수정'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
