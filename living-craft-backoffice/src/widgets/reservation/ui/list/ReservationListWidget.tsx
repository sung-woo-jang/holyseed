/**
 * 예약 목록 위젯
 * 예약 목록을 조회하고 테이블로 표시하는 독립적인 UI 블록
 */
import { useFetchReservations } from '@/features/reservations/api'
import { ReservationsTable } from '@/features/reservations/ui/reservations-table/ReservationsTable'
import styles from './ReservationListWidget.module.scss'

export function ReservationListWidget() {
  const { data: reservationsResponse, isLoading, error } = useFetchReservations()
  const data = reservationsResponse?.data

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>예약을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>예약을 불러오는데 실패했습니다.</p>
        </div>
      </div>
    )
  }

  // 데이터 표시
  if (!data?.items) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyContainer}>
          <p className={styles.emptyText}>예약이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <ReservationsTable data={data.items} />
    </div>
  )
}
