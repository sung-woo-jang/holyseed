/**
 * 예약 관리 페이지
 * FSD pages 레이어: 위젯을 조합하여 완전한 페이지 구성
 */
import { PageHeader } from '@/widgets/page-header'
import { ReservationListWidget } from '@/widgets/reservation'

export function ReservationsPage() {
  return (
    <div className='flex h-full flex-col gap-4 p-4 md:gap-8 md:p-8'>
      {/* 페이지 헤더 */}
      <PageHeader
        title='예약 관리'
        description='고객 예약을 조회하고 상태를 관리합니다.'
      />

      {/* 예약 목록 위젯 */}
      <ReservationListWidget />
    </div>
  )
}
