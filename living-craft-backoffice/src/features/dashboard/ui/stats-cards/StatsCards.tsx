import type { DashboardStats } from '@/shared/types/api'
import { Calendar, TrendingUp, Star, CheckCircle2 } from 'lucide-react'
import { MetricCard } from './MetricCard'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <MetricCard
        title='오늘의 예약'
        value={stats.todayReservations.count}
        description='금일 접수된 예약 건수'
        icon={Calendar}
        trend={{
          value: stats.todayReservations.change,
          isPositive: stats.todayReservations.change > 0,
        }}
      />
      <MetricCard
        title='월간 예약'
        value={stats.monthlyReservations.count}
        description='이번 달 총 예약 건수'
        icon={TrendingUp}
        trend={{
          value: stats.monthlyReservations.change,
          isPositive: stats.monthlyReservations.change > 0,
        }}
      />
      <MetricCard
        title='평균 평점'
        value={
          typeof stats.averageRating.value === 'number'
            ? `${stats.averageRating.value.toFixed(1)} / 5.0`
            : '- / 5.0'
        }
        description={`총 ${stats.averageRating.totalReviews}개의 리뷰`}
        icon={Star}
      />
      <MetricCard
        title='완료율'
        value={
          typeof stats.completionRate.percentage === 'number'
            ? `${stats.completionRate.percentage.toFixed(1)}%`
            : '-%'
        }
        description={`${stats.completionRate.completed} / ${stats.completionRate.total} 건 완료`}
        icon={CheckCircle2}
        progress={
          typeof stats.completionRate.percentage === 'number'
            ? stats.completionRate.percentage
            : 0
        }
      />
    </div>
  )
}
