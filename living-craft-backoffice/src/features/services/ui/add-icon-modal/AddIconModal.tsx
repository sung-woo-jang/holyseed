import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useCreateIcon, type IconType } from '@/features/services/api'
import styles from './styles.module.scss'

/**
 * 아이콘 추가 폼 스키마
 */
const addIconSchema = z.object({
  name: z
    .string()
    .min(1, '아이콘 이름을 입력하세요')
    .max(200, '아이콘 이름은 200자를 초과할 수 없습니다'),
  type: z.enum(['FILL', 'MONO', 'COLOR']),
})

type AddIconFormValues = z.infer<typeof addIconSchema>

interface AddIconModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIconName?: string
  onSuccess?: (iconId: number, iconName: string) => void
}

/**
 * 아이콘 추가 모달
 */
export function AddIconModal({
  open,
  onOpenChange,
  initialIconName = '',
  onSuccess,
}: AddIconModalProps) {
  const createIconMutation = useCreateIcon()

  const form = useForm<AddIconFormValues>({
    resolver: zodResolver(addIconSchema),
    defaultValues: {
      name: initialIconName,
      type: 'MONO',
    },
  })

  const { handleSubmit, control, reset } = form

  const onSubmit = async (data: AddIconFormValues) => {
    try {
      const response = await createIconMutation.mutateAsync({
        name: data.name,
        type: data.type as IconType,
      })

      // 성공 시 콜백 호출
      if (onSuccess && response) {
        onSuccess(response.id, response.name)
      }

      // 폼 초기화 및 모달 닫기
      reset()
      onOpenChange(false)
    } catch {
      // 에러는 mutation hook에서 toast로 처리됨
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader>
          <DialogTitle>새 아이콘 추가</DialogTitle>
          <DialogDescription>
            새로운 Toss Asset Icon을 등록합니다. 아이콘 이름과 타입을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <FieldGroup>
            <Controller
              name='name'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='iconName'>
                    아이콘 이름 <span className={styles.required}>*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id='iconName'
                    placeholder='예: icon-account-fill'
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Toss Asset Icon 라이브러리의 아이콘 이름을 정확히 입력하세요
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name='type'
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='iconType'>
                    아이콘 타입 <span className={styles.required}>*</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id='iconType'>
                      <SelectValue placeholder='타입 선택' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='MONO'>MONO</SelectItem>
                      <SelectItem value='FILL'>FILL</SelectItem>
                      <SelectItem value='COLOR'>COLOR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    아이콘의 종류를 선택하세요 (기본: MONO)
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={createIconMutation.isPending}
            >
              취소
            </Button>
            <Button type='submit' disabled={createIconMutation.isPending}>
              {createIconMutation.isPending ? '추가 중...' : '아이콘 추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
