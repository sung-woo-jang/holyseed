import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/shared/lib/format'
import type { Review } from '@/shared/types/api'
import { DataTableColumnHeader } from '@/shared/ui-kit/data-table'
import { Badge } from '@/shared/ui/badge'
import { Star } from 'lucide-react'

export const reviewsColumns: ColumnDef<Review>[] = [
  {
    accessorKey: 'rating',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='평점' />
    ),
    cell: ({ row }) => {
      const rating = row.getValue('rating') as number
      return (
        <div className='flex items-center gap-1'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`size-4 ${
                index < rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-muted text-muted-foreground'
              }`}
            />
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='고객명' />
    ),
  },
  {
    accessorKey: 'serviceName',
    header: '서비스',
    cell: ({ row }) => (
      <Badge variant='outline'>{row.getValue('serviceName')}</Badge>
    ),
  },
  {
    accessorKey: 'content',
    header: '리뷰 내용',
    cell: ({ row }) => (
      <div className='max-w-md truncate'>{row.getValue('content')}</div>
    ),
  },
  {
    accessorKey: 'isVisible',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='표시 여부' />
    ),
    cell: ({ row }) => {
      const isVisible = row.getValue('isVisible') as boolean
      return (
        <Badge variant={isVisible ? 'default' : 'secondary'}>
          {isVisible ? '표시' : '숨김'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='작성일' />
    ),
    cell: ({ row }) => formatDate(row.getValue('createdAt')),
  },
]
