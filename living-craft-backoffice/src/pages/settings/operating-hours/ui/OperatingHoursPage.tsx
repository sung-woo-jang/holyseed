import { PageHeader } from '@/widgets/page-header'
import {
  useFetchOperatingHours,
  useFetchHolidays,
} from '@/features/operating-hours/api'
import { HolidaysCalendar } from '@/features/operating-hours/ui/holidays-calendar'
import { TimeSlotForm } from '@/features/operating-hours/ui/time-slot-form'

/**
 * 운영 시간 설정 페이지
 */
export function OperatingHoursPage() {
  const {
    data: operatingHoursResponse,
    isLoading: isLoadingHours,
    error: hoursError,
  } = useFetchOperatingHours()
  const {
    data: holidaysResponse,
    isLoading: isLoadingHolidays,
    error: holidaysError,
  } = useFetchHolidays()

  const operatingHours = operatingHoursResponse?.data
  const holidays = holidaysResponse?.data

  const isLoading = isLoadingHours || isLoadingHolidays
  const error = hoursError || holidaysError

  return (
    <div className='flex h-full flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <PageHeader
        title='운영 시간 설정'
        description='견적 및 시공 가능 시간과 휴무일을 관리합니다.'
      />

      {isLoading && (
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
            <p className='text-muted-foreground'>설정을 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-destructive'>설정을 불러오는데 실패했습니다.</p>
        </div>
      )}

      {!isLoading && !error && operatingHours && holidays && (
        <div className='space-y-6'>
          {/* 견적 가능 시간 */}
          <TimeSlotForm
            title='견적 가능 시간'
            description='고객이 견적을 요청할 수 있는 시간대를 설정합니다'
            operatingHours={operatingHours}
            slotType='estimateSlots'
          />

          {/* 시공 가능 시간 */}
          <TimeSlotForm
            title='시공 가능 시간'
            description='실제 시공 작업이 가능한 시간대를 설정합니다'
            operatingHours={operatingHours}
            slotType='constructionSlots'
          />

          {/* 휴무일 관리 */}
          <HolidaysCalendar holidays={holidays} />
        </div>
      )}
    </div>
  )
}
