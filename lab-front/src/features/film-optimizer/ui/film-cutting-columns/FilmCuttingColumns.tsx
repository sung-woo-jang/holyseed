import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/shared/ui-kit/data-table'
import { Badge } from '@/shared/ui/badge'
import type { CuttingProjectListItem } from '@/features/film-optimizer/api'
import { FilmCuttingRowActions } from '../film-cutting-row-actions'
import styles from './styles.module.scss'

export const filmCuttingColumns: ColumnDef<CuttingProjectListItem>[] = [
  // 1. 프로젝트명
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='프로젝트명' />
    ),
    cell: ({ row, table }) => {
      const meta = table.options.meta as
        | { onEdit: (id: number) => void }
        | undefined

      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        meta?.onEdit?.(row.original.id)
      }

      return (
        <button className={styles.projectNameButton} onClick={handleClick}>
          {row.getValue('name')}
        </button>
      )
    },
  },

  // 2. 필름
  {
    accessorKey: 'filmName',
    header: '필름',
    cell: ({ row }) => (
      <span>
        {row.original.filmName} ({row.original.filmWidth}mm)
      </span>
    ),
    enableSorting: false,
  },

  // 3. 조각 수
  {
    accessorKey: 'pieceCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='조각 수' />
    ),
    cell: ({ row }) => (
      <div className={styles.centeredCell}>{row.getValue('pieceCount')}개</div>
    ),
  },

  // 4. 진행률
  {
    id: 'progress',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='진행률' />
    ),
    cell: ({ row }) => {
      const total = row.original.pieceCount
      const completed = row.original.completedPieceCount
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      const isComplete = percentage === 100

      return (
        <div className={styles.centeredCell}>
          <Badge
            variant={isComplete ? 'default' : 'secondary'}
            className={isComplete ? styles.badgeComplete : undefined}
          >
            {completed}/{total} ({percentage}%)
          </Badge>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const percentageA =
        rowA.original.pieceCount > 0
          ? (rowA.original.completedPieceCount / rowA.original.pieceCount) * 100
          : 0
      const percentageB =
        rowB.original.pieceCount > 0
          ? (rowB.original.completedPieceCount / rowB.original.pieceCount) * 100
          : 0
      return percentageA - percentageB
    },
  },

  // 5. 손실율
  {
    accessorKey: 'wastePercentage',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='손실율' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('wastePercentage') as number | null
      return (
        <div className={styles.centeredCell}>
          {typeof value === 'number' ? `${value.toFixed(1)}%` : '-'}
        </div>
      )
    },
  },

  // 6. 사용 길이
  {
    accessorKey: 'usedLength',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='사용 길이' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('usedLength') as number | null
      return (
        <div className={styles.centeredCell}>
          {typeof value === 'number' ? `${value}mm` : '-'}
        </div>
      )
    },
  },

  // 7. 생성일
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='생성일' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return date.toLocaleDateString('ko-KR')
    },
  },

  // 8. 작업
  {
    id: 'actions',
    header: () => <div className={styles.centeredCell}>작업</div>,
    cell: ({ row, table }) => <FilmCuttingRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
