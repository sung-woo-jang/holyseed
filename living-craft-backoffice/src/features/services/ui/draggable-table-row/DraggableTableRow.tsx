import type { Row } from '@tanstack/react-table'
import type { ServiceAdminListItem } from '@/shared/types/api'
import { TableRow, TableCell } from '@/shared/ui/table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { GripVertical } from 'lucide-react'
import styles from './styles.module.scss'

interface DraggableTableRowProps {
  row: Row<ServiceAdminListItem>
  children: React.ReactNode
  onClick?: () => void
}

export function DraggableTableRow({
  row,
  children,
  onClick,
}: DraggableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id })

  const handleRowClick = () => {
    // 드래그 중이거나 onClick이 없으면 무시
    if (isDragging || !onClick) return
    onClick()
  }

  const handleDragHandleClick = (e: React.MouseEvent) => {
    // 드래그 핸들 클릭 시 행 클릭 이벤트가 발생하지 않도록 방지
    e.stopPropagation()
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-state={row.getIsSelected() && 'selected'}
      onClick={handleRowClick}
      className={clsx(onClick && !isDragging && styles.clickableRow)}
    >
      <TableCell className='w-12 px-2'>
        <div
          {...listeners}
          className={styles.dragHandle}
          aria-label='드래그하여 순서 변경'
          onClick={handleDragHandleClick}
        >
          <GripVertical className='text-muted-foreground size-4' />
        </div>
      </TableCell>
      {children}
    </TableRow>
  )
}
