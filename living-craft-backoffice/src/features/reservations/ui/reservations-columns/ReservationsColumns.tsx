import { type ColumnDef } from '@tanstack/react-table'
import { reservationStatuses, type Reservation } from '@/entities/reservation'
import {
  formatDate,
  formatTime,
  formatPhoneNumber,
  formatAddressShort,
} from '@/shared/lib/format'
import { DataTableColumnHeader } from '@/shared/ui-kit/data-table'
import { Badge } from '@/shared/ui/badge'
import { Checkbox } from '@/shared/ui/checkbox'

export const reservationsColumns: ColumnDef<Reservation>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='전체 선택'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='행 선택'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'reservationNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='예약번호' />
    ),
    cell: ({ row }) => (
      <div className='w-[100px] font-medium'>
        {row.getValue('reservationNumber')}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='고객명' />
    ),
    cell: ({ row }) => (
      <div className='w-[80px]'>{row.getValue('customerName')}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'customerPhone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='전화번호' />
    ),
    cell: ({ row }) => (
      <div className='w-[110px]'>
        {formatPhoneNumber(row.getValue('customerPhone'))}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'serviceName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='서비스' />
    ),
    cell: ({ row }) => (
      <div className='max-w-[150px] truncate'>
        {row.getValue('serviceName')}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'estimateDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='견적 일시' />
    ),
    cell: ({ row }) => {
      const date = formatDate(row.getValue('estimateDate'))
      const time = formatTime(row.original.estimateTime)
      return (
        <div className='w-[120px]'>
          <div className='text-sm'>{date}</div>
          <div className='text-muted-foreground text-xs'>{time}</div>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'constructionDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='시공 일시' />
    ),
    cell: ({ row }) => {
      const date = formatDate(row.getValue('constructionDate'))
      const time = row.original.constructionTime
        ? formatTime(row.original.constructionTime)
        : '하루 종일'
      return (
        <div className='w-[120px]'>
          <div className='text-sm'>{date}</div>
          <div className='text-muted-foreground text-xs'>{time}</div>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='주소' />
    ),
    cell: ({ row }) => (
      <div className='max-w-[200px] truncate' title={row.getValue('address')}>
        {formatAddressShort(row.getValue('address'), 30)}
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='상태' />
    ),
    cell: ({ row }) => {
      const status = reservationStatuses.find(
        (s) => s.value === row.getValue('status')
      )

      if (!status) {
        return null
      }

      return (
        <div className='flex w-[80px] items-center gap-2'>
          <Badge variant={status.variant}>
            {status.icon && <status.icon className='mr-1 size-3' />}
            {status.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='생성일' />
    ),
    cell: ({ row }) => (
      <div className='w-[100px]'>{formatDate(row.getValue('createdAt'))}</div>
    ),
    enableSorting: true,
  },
]
