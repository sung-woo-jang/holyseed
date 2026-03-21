import { Button } from '@/shared/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/widgets/page-header'
import { useFetchServicesList } from '@/features/services/api'
import { ServicesTable } from '@/features/services/ui/services-table'

/**
 * 서비스 관리 페이지
 */
export function ServicesPage() {
  const navigate = useNavigate()
  const { data: servicesData, isLoading, error } = useFetchServicesList()
  const data = servicesData?.data

  const handleCreateService = () => {
    navigate('/services/new')
  }

  const handleEditService = (serviceId: number) => {
    navigate(`/services/${serviceId}/edit`)
  }

  return (
    <div className='flex h-full flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <PageHeader
        title='서비스 관리'
        description='제공하는 서비스를 관리하고 지역별 출장비를 설정합니다.'
        action={
          <Button onClick={handleCreateService}>
            <Plus className='mr-2 size-4' />
            서비스 추가
          </Button>
        }
      />

      {isLoading && (
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
            <p className='text-muted-foreground'>서비스를 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-destructive'>서비스를 불러오는데 실패했습니다.</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <ServicesTable data={data} onEdit={handleEditService} />
      )}
    </div>
  )
}
