import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCreateFilm } from '../../api'
import styles from './styles.module.scss'

interface CreateFilmDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean
  /** 다이얼로그 닫기 콜백 */
  onOpenChange: (open: boolean) => void
  /** 필름 생성 성공 콜백 (생성된 필름 ID 전달) */
  onSuccess: (filmId: number) => void
  /** 비활성화 상태 */
  disabled?: boolean
}

/**
 * 필름 생성 다이얼로그 컴포넌트
 *
 * 필름 이름, 너비, 길이, 설명을 입력받아 새로운 필름을 생성합니다.
 */
export function CreateFilmDialog({
  open,
  onOpenChange,
  onSuccess,
  disabled = false,
}: CreateFilmDialogProps) {
  const [name, setName] = useState('')
  const [width, setWidth] = useState('1220')
  const [length, setLength] = useState('60000')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createFilm = useCreateFilm()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 이름 검증 (필수)
    if (!name.trim()) {
      newErrors.name = '필름 이름을 입력하세요.'
    } else if (name.trim().length > 50) {
      newErrors.name = '필름 이름은 50자 이하로 입력하세요.'
    }

    // 너비 검증 (선택, 입력 시에만)
    if (width) {
      const widthNum = parseInt(width, 10)
      if (isNaN(widthNum) || widthNum < 100 || widthNum > 5000) {
        newErrors.width = '너비는 100 ~ 5000mm 사이로 입력하세요.'
      }
    }

    // 길이 검증 (선택, 입력 시에만)
    if (length) {
      const lengthNum = parseInt(length, 10)
      if (isNaN(lengthNum) || lengthNum < 1000 || lengthNum > 100000) {
        newErrors.length = '길이는 1000 ~ 100000mm 사이로 입력하세요.'
      }
    }

    // 설명 검증 (선택)
    if (description.length > 200) {
      newErrors.description = '설명은 200자 이하로 입력하세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const result = await createFilm.mutateAsync({
        name: name.trim(),
        width: width ? parseInt(width, 10) : 1220,
        length: length ? parseInt(length, 10) : 60000,
        description: description.trim() || undefined,
      })

      // 성공 시 생성된 필름 ID를 부모에게 전달
      onSuccess(result.id)
      handleClose()
    } catch {
      // 에러는 mutation hook에서 자동 처리 (toast)
    }
  }

  const handleClose = () => {
    // 폼 상태 초기화
    setName('')
    setWidth('1220')
    setLength('60000')
    setDescription('')
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle>새 필름 추가</DialogTitle>
          <DialogDescription>
            재단에 사용할 필름을 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          {/* 필름 이름 (필수) */}
          <div className={styles.formGroup}>
            <Label htmlFor='filmName'>필름 이름 *</Label>
            <Input
              id='filmName'
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: '' }))
              }}
              placeholder='예: 표준 인테리어 필름'
              disabled={disabled || createFilm.isPending}
              className={errors.name ? styles.inputError : ''}
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}
          </div>

          {/* 너비 (선택) */}
          <div className={styles.formGroup}>
            <Label htmlFor='filmWidth'>너비 (mm)</Label>
            <Input
              id='filmWidth'
              type='number'
              value={width}
              onChange={(e) => {
                setWidth(e.target.value)
                setErrors((prev) => ({ ...prev, width: '' }))
              }}
              placeholder='1220'
              disabled={disabled || createFilm.isPending}
              className={errors.width ? styles.inputError : ''}
            />
            {errors.width && <p className={styles.errorText}>{errors.width}</p>}
            <p className={styles.hint}>기본값: 1220mm</p>
          </div>

          {/* 길이 (선택) */}
          <div className={styles.formGroup}>
            <Label htmlFor='filmLength'>길이 (mm)</Label>
            <Input
              id='filmLength'
              type='number'
              value={length}
              onChange={(e) => {
                setLength(e.target.value)
                setErrors((prev) => ({ ...prev, length: '' }))
              }}
              placeholder='60000'
              disabled={disabled || createFilm.isPending}
              className={errors.length ? styles.inputError : ''}
            />
            {errors.length && (
              <p className={styles.errorText}>{errors.length}</p>
            )}
            <p className={styles.hint}>기본값: 60000mm (60m)</p>
          </div>

          {/* 설명 (선택) */}
          <div className={styles.formGroup}>
            <Label htmlFor='filmDescription'>설명 (선택)</Label>
            <Textarea
              id='filmDescription'
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setErrors((prev) => ({ ...prev, description: '' }))
              }}
              placeholder='필름에 대한 추가 정보를 입력하세요'
              rows={3}
              disabled={disabled || createFilm.isPending}
              className={errors.description ? styles.inputError : ''}
            />
            {errors.description && (
              <p className={styles.errorText}>{errors.description}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={disabled || createFilm.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={disabled || createFilm.isPending || !name.trim()}
          >
            {createFilm.isPending ? '생성 중...' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
