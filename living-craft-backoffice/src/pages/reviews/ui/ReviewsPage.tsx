import { PageHeader } from '@/widgets/page-header'
import { useFetchReviews } from '@/features/reviews/api'
import { ReviewsTable } from '@/features/reviews/ui/reviews-table'

/**
 * 리뷰 관리 페이지
 */
export function ReviewsPage() {
  const { data: reviewsResponse, isLoading, error } = useFetchReviews()
  const data = reviewsResponse?.data

  return (
    <div className='flex h-full flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <PageHeader
        title='리뷰 관리'
        description='고객 리뷰를 조회하고 관리합니다.'
      />

      {isLoading && (
        <div className='flex h-[400px] items-center justify-center'>
          <div className='text-center'>
            <div className='mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
            <p className='text-muted-foreground'>리뷰를 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='flex h-[400px] items-center justify-center'>
          <p className='text-destructive'>리뷰를 불러오는데 실패했습니다.</p>
        </div>
      )}

      {!isLoading &&
        !error &&
        data &&
        Array.isArray(data) &&
        data.length > 0 && <ReviewsTable data={data} />}

      {!isLoading &&
        !error &&
        (!data || !Array.isArray(data) || data.length === 0) && (
          <div className='flex h-[400px] items-center justify-center'>
            <p className='text-muted-foreground'>아직 리뷰가 없습니다.</p>
          </div>
        )}
    </div>
  )
}
