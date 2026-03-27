export interface Review {
  id: string
  reservationId: string
  userId: string
  userName: string
  rating: number
  content: string
  images?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateReviewRequest {
  reservationId: string
  rating: number
  content: string
  images?: string[]
}

export interface UpdateReviewRequest {
  rating?: number
  content?: string
  images?: string[]
}

export interface ReviewListResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  averageRating: number
}

export interface ReviewDetailResponse {
  review: Review
}
