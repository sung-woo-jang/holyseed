import { type ColumnDef } from '@tanstack/react-table'
import type { IconAdminListItem } from '@/shared/types/api'
import { DataTableColumnHeader } from '@/shared/ui-kit/data-table'
import { IconTypeBadge } from '../icon-type-badge'

/**
 * 날짜 포맷 헬퍼 함수
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 아이콘 테이블 컬럼 정의
 */
export const iconsColumns: ColumnDef<IconAdminListItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='아이콘 이름' />
    ),
    cell: ({ row }) => {
      return <span className='font-medium'>{row.getValue('name')}</span>
    },
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='타입' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as IconAdminListItem['type']
      return <IconTypeBadge type={type} />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='생성일' />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string
      return <span className='text-muted-foreground'>{formatDate(createdAt)}</span>
    },
  },
]
