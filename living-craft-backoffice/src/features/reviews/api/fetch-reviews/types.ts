/**
 * 리뷰 정보
 */
export interface Review {
  id: string
  userId: string
  customerName: string
  reservationId: string
  serviceId: string
  serviceName: string
  rating: number
  content: string
  photos: string[]
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type FetchReviewsResponse = Review[]
