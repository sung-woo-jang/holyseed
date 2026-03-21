import type { Reservation } from '@/features/reservations/api'
import type { Review } from '@/features/reviews/api'

/**
 * 고객 정보
 */
export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalReservations: number
  totalReviews: number
  averageRating?: number
  createdAt: string
  lastReservationAt?: string
}

/**
 * 고객 상세 정보 (예약 및 리뷰 포함)
 */
export interface CustomerDetail extends Customer {
  reservations: Reservation[]
  reviews: Review[]
}

export type FetchCustomersResponse = Customer[]
