import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/shared/lib/format'
import type { Customer } from '@/shared/types/api'
import { DataTableColumnHeader } from '@/shared/ui-kit/data-table'
import { Badge } from '@/shared/ui/badge'
import { Star } from 'lucide-react'

export const customersColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='고객명' />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'phone',
    header: '전화번호',
    cell: ({ row }) => (
      <div className='font-mono text-sm'>{row.getValue('phone')}</div>
    ),
  },
  {
    accessorKey: 'email',
    header: '이메일',
    cell: ({ row }) => {
      const email = row.getValue('email') as string | undefined
      return email ? (
        <div className='text-muted-foreground text-sm'>{email}</div>
      ) : (
        <div className='text-muted-foreground text-sm'>-</div>
      )
    },
  },
  {
    accessorKey: 'totalReservations',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='총 예약' />
    ),
    cell: ({ row }) => {
      const count = row.getValue('totalReservations') as number
      return (
        <Badge variant='outline' className='font-mono'>
          {count}건
        </Badge>
      )
    },
  },
  {
    accessorKey: 'totalReviews',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='총 리뷰' />
    ),
    cell: ({ row }) => {
      const count = row.getValue('totalReviews') as number
      return (
        <Badge variant='outline' className='font-mono'>
          {count}건
        </Badge>
      )
    },
  },
  {
    accessorKey: 'averageRating',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='평균 평점' />
    ),
    cell: ({ row }) => {
      const rating = row.getValue('averageRating') as number | undefined
      if (!rating) {
        return <div className='text-muted-foreground text-sm'>-</div>
      }
      return (
        <div className='flex items-center gap-1'>
          <Star className='size-4 fill-yellow-400 text-yellow-400' />
          <span className='font-medium'>{rating.toFixed(1)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='가입일' />
    ),
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
  {
    accessorKey: 'lastReservationAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='최근 예약일' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('lastReservationAt') as string | undefined
      return date ? (
        formatDate(date)
      ) : (
        <div className='text-muted-foreground text-sm'>-</div>
      )
    },
  },
]
