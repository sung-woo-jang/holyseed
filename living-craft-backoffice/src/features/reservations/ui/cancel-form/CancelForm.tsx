/**
 * 예약 취소 폼 컴포넌트
 * FSD features 레이어: 예약 취소라는 사용자 액션 구현
 */
import { useState } from 'react'
import { useCancelReservation } from '@/features/reservations/api'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import styles from './CancelForm.module.scss'

interface CancelFormProps {
  reservationId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CancelForm({
  reservationId,
  onSuccess,
  onCancel,
}: CancelFormProps) {
  const [cancelReason, setCancelReason] = useState('')
  const cancelReservation = useCancelReservation()

  const handleSubmit = async () => {
    if (!cancelReason.trim()) {
      alert('취소 사유를 입력해주세요.')
      return
    }

    await cancelReservation.mutateAsync(
      {
        id: reservationId,
        reason: cancelReason,
      },
      {
        onSuccess: () => {
          setCancelReason('')
          onSuccess?.()
        },
      }
    )
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>취소 사유</label>
      <Textarea
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
        placeholder='취소 사유를 입력하세요'
        rows={3}
        className={styles.textarea}
      />
      <div className={styles.actions}>
        <Button
          onClick={handleSubmit}
          disabled={cancelReservation.isPending}
          variant='destructive'
          size='sm'
        >
          {cancelReservation.isPending ? '취소 처리 중...' : '취소 확정'}
        </Button>
        <Button onClick={onCancel} variant='outline' size='sm'>
          취소
        </Button>
      </div>
    </div>
  )
}
