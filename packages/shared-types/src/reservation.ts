export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface CreateReservationRequest {
  serviceId: string
  estimateDate: string
  estimateTime: string
  constructionDate: string
  constructionTime: string | null
  address: string
  detailAddress: string
  customerName: string
  customerPhone: string
  memo: string
  photos: string[]
}

export interface Reservation {
  id: string
  serviceId: string
  serviceName: string
  status: ReservationStatus
  estimateDate: string
  estimateTime: string
  constructionDate: string
  constructionTime: string | null
  address: string
  detailAddress: string
  customerName: string
  customerPhone: string
  memo: string
  photos: string[]
  totalCost: number
  createdAt: string
  updatedAt: string
}
