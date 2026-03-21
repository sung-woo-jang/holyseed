/**
 * 예약 상세 정보 위젯
 * FSD widgets 레이어: 섹션과 피처들을 조합한 독립적인 UI 블록
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reservationStatuses } from '@/entities/reservation'
import {
  useFetchReservationDetail,
  type ReservationStatus,
} from '@/features/reservations/api'
import { CancelForm } from '@/features/reservations/ui/cancel-form'
import { StatusManager } from '@/features/reservations/ui/status-manager'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  AddressInfoSection,
  CancelInfoSection,
  CustomerInfoSection,
  MemoSection,
  OtherInfoSection,
  PhotosSection,
  ScheduleInfoSection,
  ServiceInfoSection,
} from './sections'
import styles from './ReservationDetailWidget.module.scss'

interface ReservationDetailWidgetProps {
  reservationId: string | number
}

export function ReservationDetailWidget({
  reservationId,
}: ReservationDetailWidgetProps) {
  const navigate = useNavigate()
  const [showCancelForm, setShowCancelForm] = useState(false)

  // 예약 상세 데이터 조회
  const { data: reservationResponse, isLoading } =
    useFetchReservationDetail(String(reservationId))
  const reservation = reservationResponse?.data

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>예약 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 예약이 없는 경우
  if (!reservation) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <p>예약을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const status = reservationStatuses.find((s) => s.value === reservation.status)

  const handleCancelSuccess = () => {
    setShowCancelForm(false)
    navigate('/reservations')
  }

  return (
    <div className={styles.container}>
      {/* 위젯 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>예약 상세 정보</h1>
            {status && (
              <Badge variant={status.variant}>
                {status.icon && <status.icon className='mr-1 size-3' />}
                {status.label}
              </Badge>
            )}
          </div>
          <p className={styles.description}>
            예약번호: {reservation.reservationNumber}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant='outline' onClick={() => navigate('/reservations')}>
            목록으로
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <div className={styles.body}>
        <div className={styles.content}>
          {/* 예약 상태 관리 (취소 상태가 아닌 경우만) */}
          {reservation.status !== 'cancelled' && (
            <div className={styles.section}>
              <StatusManager
                reservationId={String(reservation.id)}
                currentStatus={reservation.status as ReservationStatus}
                onCancelRequested={() => setShowCancelForm(true)}
              />
              {showCancelForm && (
                <CancelForm
                  reservationId={String(reservation.id)}
                  onSuccess={handleCancelSuccess}
                  onCancel={() => setShowCancelForm(false)}
                />
              )}
            </div>
          )}

          {/* 정보 섹션들 */}
          <CustomerInfoSection
            customerName={reservation.customerName}
            customerPhone={reservation.customerPhone}
          />

          <ServiceInfoSection serviceName={reservation.service.title} />

          <ScheduleInfoSection
            estimateDate={reservation.estimateDate}
            estimateTime={reservation.estimateTime}
            constructionDate={reservation.constructionDate ?? ''}
            constructionTime={reservation.constructionTime}
          />

          <AddressInfoSection
            address={reservation.address}
            detailAddress={reservation.detailAddress}
          />

          <MemoSection memo={reservation.memo} />

          <PhotosSection photos={reservation.photos ?? []} />

          <CancelInfoSection
            status={reservation.status}
            cancelReason={reservation.cancelReason ?? null}
            canceledAt={reservation.cancelledAt}
          />

          <OtherInfoSection
            createdAt={reservation.createdAt}
            updatedAt={reservation.updatedAt}
          />
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className={styles.footer}>
        {reservation.status !== 'cancelled' && (
          <Button
            onClick={() => setShowCancelForm(true)}
            variant='destructive'
            disabled={showCancelForm}
          >
            예약 취소
          </Button>
        )}
        <Button variant='outline' onClick={() => navigate('/reservations')}>
          닫기
        </Button>
      </div>
    </div>
  )
}
