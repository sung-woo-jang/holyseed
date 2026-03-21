import { PageHeader } from '@/widgets/page-header'
import { useFetchCustomers } from '@/features/customers/api'
import { CustomersTable } from '@/features/customers/ui/customers-table'

/**
 * 고객 관리 페이지
 */
export function CustomersPage() {
  const { data: customersResponse, isLoading, error } = useFetchCustomers()
  const data = customersResponse?.data

  return (
    <div className='flex h-full flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <PageHeader
        title='고객 관리'
        description='고객 정보를 조회하고 예약 이력을 확인합니다.'
      />

      {isLoading && (
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
            <p className='text-muted-foreground'>고객 정보를 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-destructive'>
            고객 정보를 불러오는데 실패했습니다.
          </p>
        </div>
      )}

      {!isLoading &&
        !error &&
        data &&
        Array.isArray(data) &&
        data.length > 0 && <CustomersTable data={data} />}

      {!isLoading &&
        !error &&
        (!data || !Array.isArray(data) || data.length === 0) && (
          <div className='flex h-[400px] items-center justify-center'>
            <p className='text-muted-foreground'>등록된 고객이 없습니다.</p>
          </div>
        )}
    </div>
  )
}
