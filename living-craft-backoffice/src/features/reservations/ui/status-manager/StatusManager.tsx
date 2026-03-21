/**
 * 예약 상태 관리 컴포넌트
 * FSD features 레이어: 상태 변경이라는 사용자 액션 구현
 */
import { useState } from 'react'
import clsx from 'clsx'
import { reservationStatuses } from '@/entities/reservation'
import {
  useUpdateReservationStatus,
  type ReservationStatus,
} from '@/features/reservations/api'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import styles from './StatusManager.module.scss'

interface StatusManagerProps {
  reservationId: string
  currentStatus: ReservationStatus
  onStatusChanged?: () => void
  onCancelRequested?: () => void
}

export function StatusManager({
  reservationId,
  currentStatus,
  onStatusChanged,
  onCancelRequested,
}: StatusManagerProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<ReservationStatus>(currentStatus)
  const updateStatus = useUpdateReservationStatus()

  const currentStatusInfo = reservationStatuses.find(
    (s) => s.value === currentStatus
  )
  const selectedStatusInfo = reservationStatuses.find(
    (s) => s.value === selectedStatus
  )

  // 상태 변경 가능 여부 판단
  const isChanged = selectedStatus !== currentStatus
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'completed'

  const handleStatusChange = async () => {
    if (!isChanged) return

    // 취소 상태로 변경하려는 경우 별도 처리
    if (selectedStatus === 'cancelled') {
      onCancelRequested?.()
      return
    }

    await updateStatus.mutateAsync(
      {
        id: reservationId,
        status: selectedStatus,
      },
      {
        onSuccess: () => {
          onStatusChanged?.()
        },
      }
    )
  }

  if (isCancelled) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>상태 관리</h3>
        </div>
        <div className={styles.lockedStatus}>
          {currentStatusInfo && (
            <>
              {currentStatusInfo.icon && (
                <currentStatusInfo.icon className={styles.statusIcon} />
              )}
              <span className={styles.statusLabel}>{currentStatusInfo.label}</span>
            </>
          )}
          <span className={styles.statusBadge}>변경 불가</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>상태 관리</h3>
        {currentStatusInfo && (
          <div
            className={clsx(
              styles.currentStatus,
              styles[`variant_${currentStatusInfo.variant}`]
            )}
          >
            {currentStatusInfo.icon && (
              <currentStatusInfo.icon className={styles.statusIcon} />
            )}
            <span>현재: {currentStatusInfo.label}</span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.selectWrapper}>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as ReservationStatus)}
          >
            <SelectTrigger className={styles.selectTrigger}>
              <SelectValue placeholder='상태 선택' />
            </SelectTrigger>
            <SelectContent>
              {reservationStatuses
                .filter((s) => s.value !== 'cancelled')
                .map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className={styles.selectItem}>
                      {s.icon && <s.icon className={styles.selectItemIcon} />}
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {isChanged && (
          <div className={styles.actions}>
            <Button
              onClick={handleStatusChange}
              disabled={updateStatus.isPending}
              size='sm'
              className={styles.confirmBtn}
            >
              {updateStatus.isPending ? '변경 중...' : '변경'}
            </Button>
            <Button
              onClick={() => setSelectedStatus(currentStatus)}
              disabled={updateStatus.isPending}
              variant='outline'
              size='sm'
            >
              취소
            </Button>
          </div>
        )}
      </div>

      {selectedStatusInfo && isChanged && (
        <div className={styles.preview}>
          <span className={styles.previewLabel}>변경될 상태:</span>
          <div className={styles.previewStatus}>
            {selectedStatusInfo.icon && (
              <selectedStatusInfo.icon className={styles.statusIcon} />
            )}
            <span>{selectedStatusInfo.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}
