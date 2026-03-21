import { formatDate } from '@/shared/lib/format'
import type { Review } from '@/shared/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Star } from 'lucide-react'

interface RecentReviewsProps {
  reviews: Review[]
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className='flex gap-0.5'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`size-3 ${
              index < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className='col-span-4 lg:col-span-1'>
      <CardHeader>
        <CardTitle>최근 리뷰</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {reviews.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              최근 리뷰가 없습니다.
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className='border-b pb-4 last:border-0 last:pb-0'
              >
                <div className='mb-1 flex items-center justify-between'>
                  {renderStars(review.rating)}
                  <span className='text-muted-foreground text-xs'>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className='mb-1 text-sm font-medium'>
                  {review.customerName}
                </p>
                <p className='text-muted-foreground line-clamp-2 text-xs'>
                  {review.content}
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {review.serviceName}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
