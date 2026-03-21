/**
 * 예약 상태
 */
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

/**
 * 아이콘 타입
 */
export type IconType = 'MONO' | 'COLOR'

/**
 * 아이콘 정보
 */
export interface Icon {
  id: number
  createdAt: string
  updatedAt: string
  name: string
  type: IconType
}

/**
 * 서비스 정보
 */
export interface Service {
  id: number
  createdAt: string
  updatedAt: string
  title: string
  description: string
  iconId: number
  iconBgColor: string
  iconColor: string
  duration: string
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  icon: Icon
}

/**
 * 고객 정보
 */
export interface Customer {
  id: number
  createdAt: string
  updatedAt: string
  uuid: string
  tossUserId: string
  name: string
  phone: string
  email: string
  refreshToken: string | null
}

/**
 * 예약 정보
 */
export interface Reservation {
  id: number
  reservationNumber: string
  customerId: number
  serviceId: number
  customerName: string
  customerPhone: string
  estimateDate: string
  estimateTime: string
  estimateConfirmedAt: string | null
  constructionDate: string | null
  constructionTime: string | null
  constructionScheduledAt: string | null
  address: string
  detailAddress: string
  memo: string
  photos: string[] | null
  status: ReservationStatus
  cancelReason?: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  service: Service
  customer: Customer
}

/**
 * 예약 목록 응답
 */
export interface FetchReservationsResponse {
  items: Reservation[]
  total: number
}
