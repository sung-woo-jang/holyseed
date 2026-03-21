import { ConfigDrawer } from '@/shared/ui-kit/config-drawer'
import { ProfileDropdown } from '@/shared/ui-kit/profile-dropdown'
import { Search } from '@/shared/ui-kit/search'
import { ThemeSwitch } from '@/shared/ui-kit/theme-switch'
import { Header, Main } from '@/widgets/header'
import { useFetchDashboardStats } from '@/features/dashboard/api'
import { MonthlyChart } from '@/features/dashboard/ui/charts/MonthlyChart'
import { ServiceDistribution } from '@/features/dashboard/ui/charts/ServiceDistribution'
import { TimeDistribution } from '@/features/dashboard/ui/charts/TimeDistribution'
import {
  RecentReservations,
  RecentReviews,
} from '@/features/dashboard/ui/recent-activity'
import { StatsCards } from '@/features/dashboard/ui/stats-cards'

/**
 * Living Craft 대시보드 페이지
 */
export function Dashboard() {
  const { data: statsResponse, isLoading, error } = useFetchDashboardStats()
  const stats = statsResponse?.data

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='flex flex-1 items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>대시보드</h1>
          <div className='ms-auto flex items-center space-x-4'>
            <Search />
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        {isLoading && (
          <div className='flex h-[600px] items-center justify-center'>
            <div className='text-center'>
              <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
              <p className='text-muted-foreground'>
                대시보드 데이터를 불러오는 중...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className='flex h-[600px] items-center justify-center'>
            <p className='text-destructive'>
              대시보드 데이터를 불러오는데 실패했습니다.
            </p>
          </div>
        )}

        {!isLoading && !error && stats && (
          <div className='space-y-4'>
            {/* 메트릭 카드 (4개) */}
            <StatsCards stats={stats} />

            {/* 월별 예약 추이 차트 */}
            <MonthlyChart
              labels={stats.monthlyChart.labels}
              data={stats.monthlyChart.data}
            />

            {/* 서비스별 분포 & 시간대별 분포 */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <ServiceDistribution
                labels={stats.serviceDistribution.labels}
                data={stats.serviceDistribution.data}
              />
              <TimeDistribution
                labels={stats.timeDistribution.labels}
                data={stats.timeDistribution.data}
              />
            </div>

            {/* 최근 활동 (예약 & 리뷰) */}
            <div className='grid gap-4 md:grid-cols-1 lg:grid-cols-4'>
              <RecentReservations reservations={stats.recentReservations} />
              <RecentReviews reviews={stats.recentReviews} />
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
