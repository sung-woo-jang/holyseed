import { useState, useEffect } from 'react'
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { arrayMove } from '@/shared/lib/array-utils'
import type { ServiceAdminListItem } from '@/shared/types/api'
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useUpdateServiceOrder } from '../../api'
import { DraggableTableRow } from '../draggable-table-row'
import { servicesColumns } from '../services-columns'

interface ServicesTableProps {
  data: ServiceAdminListItem[]
  onEdit: (serviceId: number) => void
}

export function ServicesTable({ data, onEdit }: ServicesTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [localData, setLocalData] = useState(data)
  const updateOrder = useUpdateServiceOrder()

  // data가 변경되면 localData 동기화
  useEffect(() => {
    setLocalData(data)
  }, [data])

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localData.findIndex((item) => item.id === active.id)
    const newIndex = localData.findIndex((item) => item.id === over.id)

    // 배열 순서 변경 (낙관적 업데이트)
    const newData = arrayMove(localData, oldIndex, newIndex)

    // sortOrder 재계산
    const updatedData = newData.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }))

    setLocalData(updatedData)

    // API 호출
    updateOrder.mutate(
      {
        serviceOrders: updatedData.map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
        })),
      },
      {
        onError: () => {
          // 실패 시 롤백
          setLocalData(data)
        },
      }
    )
  }

  const table = useReactTable<ServiceAdminListItem>({
    data: localData,
    columns: servicesColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const title = String(row.getValue('title')).toLowerCase()
      const description = String(row.getValue('description')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()
      return title.includes(searchValue) || description.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      onEdit: (row: ServiceAdminListItem) => onEdit(row.id),
    },
  })

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='서비스명, 설명으로 검색...'
        filters={[
          {
            columnId: 'isActive',
            title: '상태',
            options: [
              { label: '활성', value: 'true' },
              { label: '비활성', value: 'false' },
            ],
          },
          {
            columnId: 'requiresTimeSelection',
            title: '시간 선택',
            options: [
              { label: '가능', value: 'true' },
              { label: '하루 종일', value: 'false' },
            ],
          },
        ]}
      />
      <div className='rounded-md border'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localData.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {/* 드래그 핸들 헤더 추가 */}
                    <TableHead className='w-12' />
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <DraggableTableRow
                      key={row.id}
                      row={row}
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
                    </DraggableTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={servicesColumns.length + 1}
                      className='h-24 text-center'
                    >
                      결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
