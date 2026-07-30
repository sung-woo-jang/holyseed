import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  DataTablePagination,
  DataTableToolbar,
} from '@/shared/ui-kit/data-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'
import { Badge } from '@/shared/ui/badge'
import { RecordCard, RecordCardList, RecordCardMeta, RecordCardRow } from '@/shared/ui/record-card'
import type { CuttingProjectListItem } from '@/features/film-optimizer/api'
import { filmCuttingColumns } from '../film-cutting-columns'
import { FilmCuttingRowActions } from '../film-cutting-row-actions'
import styles from './styles.module.scss'

interface FilmCuttingTableProps {
  data: CuttingProjectListItem[]
  onEdit: (projectId: number) => void
  onDelete: (projectId: number) => void
}

export function FilmCuttingTable({
  data,
  onEdit,
  onDelete,
}: FilmCuttingTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const isDesktop = useIsDesktopNav()

  const table = useReactTable<CuttingProjectListItem>({
    data,
    columns: filmCuttingColumns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = String(row.getValue('name')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()
      return name.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      onEdit,
      onDelete,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })

  return (
    <div className={styles.filmCuttingTable}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='프로젝트명으로 검색...'
      />
      {isDesktop ? (
        <div className={styles.filmCuttingTableWrapper}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={styles.clickableRow}
                    onClick={() => onEdit(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={filmCuttingColumns.length}
                    className='h-24 text-center'
                  >
                    결과가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : table.getRowModel().rows?.length ? (
        <RecordCardList>
          {table.getRowModel().rows.map((row) => {
            const project = row.original
            const percentage =
              project.pieceCount > 0 ? Math.round((project.completedPieceCount / project.pieceCount) * 100) : 0
            return (
              <RecordCard key={row.id} onClick={() => onEdit(project.id)}>
                <RecordCardRow>
                  <p className="min-w-0 truncate font-medium">{project.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant={percentage === 100 ? 'default' : 'secondary'} className="text-[10px]">
                      {project.completedPieceCount}/{project.pieceCount} ({percentage}%)
                    </Badge>
                    <FilmCuttingRowActions row={row} table={table} />
                  </div>
                </RecordCardRow>
                <RecordCardMeta>
                  <span>
                    {project.filmName} ({project.filmWidth}mm)
                  </span>
                  <span>· 손실율 {typeof project.wastePercentage === 'number' ? `${project.wastePercentage.toFixed(1)}%` : '-'}</span>
                  <span>· {new Date(project.createdAt).toLocaleDateString('ko-KR')}</span>
                </RecordCardMeta>
              </RecordCard>
            )
          })}
        </RecordCardList>
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">결과가 없습니다.</p>
      )}
      <DataTablePagination table={table} />
    </div>
  )
}
