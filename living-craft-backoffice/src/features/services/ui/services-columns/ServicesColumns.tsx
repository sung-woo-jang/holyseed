import { type ColumnDef } from '@tanstack/react-table'
import type { ServiceAdminListItem } from '@/shared/types/api'
import { DataTableColumnHeader } from '@/shared/ui-kit/data-table'
import { Badge } from '@/shared/ui/badge'
import { Checkbox } from '@/shared/ui/checkbox'

/**
 * 서비스 테이블 컬럼 정의 (관리자 목록용 - 간소화된 데이터)
 */
export const servicesColumns: ColumnDef<ServiceAdminListItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='서비스명' />
    ),
    cell: ({ row }) => {
      const iconBgColor = row.original.iconBgColor

      return (
        <div className='flex items-center gap-2'>
          <div
            className='flex size-8 items-center justify-center rounded-md text-xs font-medium text-white'
            style={{ backgroundColor: iconBgColor || '#3B82F6' }}
          >
            {row.getValue('title')?.toString().charAt(0) || '서'}
          </div>
          <span className='font-medium'>{row.getValue('title')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: '설명',
    cell: ({ row }) => (
      <div className='text-muted-foreground max-w-md truncate'>
        {row.getValue('description')}
      </div>
    ),
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='소요 시간' />
    ),
    cell: ({ row }) => {
      const duration = row.getValue('duration') as string
      return <span>{duration}</span>
    },
  },
  {
    accessorKey: 'requiresTimeSelection',
    header: '시간 선택',
    cell: ({ row }) => {
      const requires = row.getValue('requiresTimeSelection') as boolean
      return (
        <Badge variant={requires ? 'default' : 'secondary'}>
          {requires ? '가능' : '하루 종일'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'regionsCount',
    header: '서비스 지역',
    cell: ({ row }) => {
      const count = row.getValue('regionsCount') as number

      if (count === 0) {
        return <span className='text-muted-foreground'>-</span>
      }

      return <Badge variant='outline'>{count}개 지역</Badge>
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='상태' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? '활성' : '비활성'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'sortOrder',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='정렬 순서' />
    ),
    cell: ({ row }) => row.getValue('sortOrder') as number,
  },
]
