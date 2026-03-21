import { type Row, type Table } from '@tanstack/react-table'
import type { ServiceAdminListItem } from '@/shared/types/api'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { useDeleteService, useToggleService } from '../../api'

interface DataTableRowActionsProps {
  row: Row<ServiceAdminListItem>
  table: Table<ServiceAdminListItem>
}

export function DataTableRowActions({ row, table }: DataTableRowActionsProps) {
  const service = row.original
  const deleteService = useDeleteService()
  const toggleService = useToggleService()

  const onEdit = table.options.meta?.onEdit as
    | ((service: ServiceAdminListItem) => void)
    | undefined

  const handleEdit = () => {
    onEdit?.(service)
  }

  const handleDelete = () => {
    if (!confirm(`"${service.title}" 서비스를 정말 삭제하시겠습니까?`)) {
      return
    }

    deleteService.mutate(String(service.id))
  }

  const handleToggleActive = () => {
    toggleService.mutate(String(service.id))
  }

  const isLoading = deleteService.isPending || toggleService.isPending

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex size-8 p-0'
          disabled={isLoading}
        >
          <MoreHorizontal className='size-4' />
          <span className='sr-only'>메뉴 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className='mr-2 size-4' />
          수정
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleActive}>
          <Eye className='mr-2 size-4' />
          {service.isActive ? '비활성화' : '활성화'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className='text-destructive'>
          <Trash2 className='mr-2 size-4' />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
