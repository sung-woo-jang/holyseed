import { formatDate, formatPhoneNumber } from '@/shared/lib/format'
import type { Reservation } from '@/shared/types/api'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Calendar, Clock } from 'lucide-react'

interface RecentReservationsProps {
  reservations: Reservation[]
}

export function RecentReservations({ reservations }: RecentReservationsProps) {
  const getStatusVariant = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
        return 'default'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending':
        return '대기'
      case 'confirmed':
        return '확정'
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소'
      default:
        return status
    }
  }

  return (
    <Card className='col-span-4 lg:col-span-3'>
      <CardHeader>
        <CardTitle>최근 예약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {reservations.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              최근 예약이 없습니다.
            </p>
          ) : (
            reservations.map((reservation) => (
              <div
                key={reservation.id}
                className='flex items-start justify-between border-b pb-4 last:border-0 last:pb-0'
              >
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <p className='text-sm font-medium'>
                      {reservation.customerName}
                    </p>
                    <Badge variant={getStatusVariant(reservation.status)}>
                      {getStatusLabel(reservation.status)}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {reservation.service.title}
                  </p>
                  <div className='text-muted-foreground flex items-center gap-3 text-xs'>
                    <span className='flex items-center gap-1'>
                      <Calendar className='size-3' />
                      {formatDate(reservation.estimateDate)}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Clock className='size-3' />
                      {reservation.estimateTime}
                    </span>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium'>
                    {reservation.reservationNumber}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {formatPhoneNumber(reservation.customerPhone)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
