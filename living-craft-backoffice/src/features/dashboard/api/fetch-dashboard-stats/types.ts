import type { Reservation } from '@/features/reservations/api'
import type { Review } from '@/features/reviews/api'

/**
 * 대시보드 통계 데이터
 */
export interface DashboardStats {
  todayReservations: {
    count: number
    change: number // 전일 대비 증감률 (%)
  }
  monthlyReservations: {
    count: number
    change: number // 전월 대비 증감률 (%)
  }
  averageRating: {
    value: number
    totalReviews: number
  }
  completionRate: {
    percentage: number
    completed: number
    total: number
  }
  monthlyChart: {
    labels: string[] // 월 이름
    data: number[] // 예약 건수
  }
  serviceDistribution: {
    labels: string[] // 서비스명
    data: number[] // 건수
  }
  timeDistribution: {
    labels: string[] // 시간대
    data: number[] // 건수
  }
  recentReservations: Reservation[]
  recentReviews: Review[]
}
