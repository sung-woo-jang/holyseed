import { useState } from 'react'
import type { CuttingPieceInput } from '@/shared/types/api'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Textarea } from '@/shared/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { parsePiecesInput } from '../../lib/parse-pieces-input'
import styles from './styles.module.scss'

interface BulkInputDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean
  /** 다이얼로그 닫기 콜백 */
  onOpenChange: (open: boolean) => void
  /** 조각 추가 콜백 */
  onAdd: (pieces: CuttingPieceInput[]) => void
  /** 비활성화 상태 */
  disabled?: boolean
}

const EXAMPLE_INPUT = `500x400
800x600 x3
300x200 창문틀
1000x500 x2 문짝`

/**
 * 일괄 입력 다이얼로그 컴포넌트
 *
 * 텍스트로 여러 조각을 한 번에 입력
 * 형식: 폭x높이 [x수량] [라벨]
 */
export function BulkInputDialog({
  open,
  onOpenChange,
  onAdd,
  disabled = false,
}: BulkInputDialogProps) {
  const [input, setInput] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = () => {
    const result = parsePiecesInput(input)

    if (!result.success) {
      setErrors(result.errors)
      return
    }

    if (result.pieces.length === 0) {
      setErrors(['입력된 조각이 없습니다.'])
      return
    }

    onAdd(result.pieces)
    handleClose()
  }

  const handleClose = () => {
    setInput('')
    setErrors([])
    onOpenChange(false)
  }

  const handlePasteExample = () => {
    setInput(EXAMPLE_INPUT)
    setErrors([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle>일괄 입력</DialogTitle>
          <DialogDescription>
            여러 조각을 텍스트로 한 번에 입력합니다.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          <div className={styles.formatHelp}>
            <strong>입력 형식:</strong>
            <code>폭x높이 [x수량] [라벨]</code>
            <p className={styles.formatExample}>
              예: <code>500x400 x3 창문틀</code> → 500×400mm, 3개, 라벨 "창문틀"
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={handlePasteExample}
              className={styles.exampleButton}
            >
              예시 붙여넣기
            </Button>
          </div>

          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setErrors([])
            }}
            placeholder={`500x400\n800x600 x3\n300x200 창문틀`}
            rows={8}
            disabled={disabled}
            className={styles.textarea}
          />

          {errors.length > 0 && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <ul className={styles.errorList}>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={disabled}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={disabled || !input.trim()}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
