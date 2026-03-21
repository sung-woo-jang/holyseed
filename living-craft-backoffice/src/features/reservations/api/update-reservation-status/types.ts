import type { ReservationStatus } from '../fetch-reservations'

/**
 * 예약 상태 변경 요청
 */
export interface UpdateReservationStatusVariables {
  id: string
  status: ReservationStatus
}
