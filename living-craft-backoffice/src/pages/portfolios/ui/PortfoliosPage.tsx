import { Button } from '@/shared/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/widgets/page-header'
import { useFetchPortfolios } from '@/features/portfolios/api'
import { PortfoliosGrid } from '@/features/portfolios/ui/portfolios-grid'

/**
 * 포트폴리오 관리 페이지
 */
export function PortfoliosPage() {
  const navigate = useNavigate()
  const { data: portfoliosResponse, isLoading, error } = useFetchPortfolios()
  const data = portfoliosResponse?.data

  const handleCreatePortfolio = () => {
    navigate('/portfolios/new')
  }

  return (
    <div className='flex h-full flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <PageHeader
        title='포트폴리오 관리'
        description='완료된 프로젝트를 등록하고 관리합니다.'
        action={
          <Button onClick={handleCreatePortfolio}>
            <Plus className='mr-2 size-4' />
            포트폴리오 추가
          </Button>
        }
      />

      {isLoading && (
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
            <p className='text-muted-foreground'>포트폴리오를 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-destructive'>
            포트폴리오를 불러오는데 실패했습니다.
          </p>
        </div>
      )}

      {!isLoading &&
        !error &&
        data &&
        Array.isArray(data) &&
        data.length > 0 && <PortfoliosGrid data={data} />}

      {!isLoading &&
        !error &&
        (!data || !Array.isArray(data) || data.length === 0) && (
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center'>
              <p className='text-muted-foreground mb-4'>
                등록된 포트폴리오가 없습니다.
              </p>
              <Button onClick={handleCreatePortfolio} variant='outline'>
                <Plus className='mr-2 size-4' />첫 포트폴리오 추가하기
              </Button>
            </div>
          </div>
        )}
    </div>
  )
}
