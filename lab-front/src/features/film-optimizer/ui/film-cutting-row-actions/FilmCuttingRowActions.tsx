import type { Row, Table } from '@tanstack/react-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { CuttingProjectListItem } from '@/features/film-optimizer/api'
import styles from './styles.module.scss'

interface FilmCuttingRowActionsProps<TData> {
  row: Row<TData>
  table: Table<TData>
}

export function FilmCuttingRowActions<TData>({
  row,
  table,
}: FilmCuttingRowActionsProps<TData>) {
  const meta = table.options.meta as
    | {
        onEdit: (id: number) => void
        onDelete: (id: number) => void
      }
    | undefined

  const project = row.original as CuttingProjectListItem

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    meta?.onEdit?.(project.id)
  }

  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      className={styles.filmCuttingRowActions}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant='ghost'
        size='icon'
        onClick={handleEditClick}
        title='수정'
      >
        <Pencil className='h-4 w-4' />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className={styles.deleteButton}
            title='삭제'
            onClick={handleDeleteButtonClick}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{project.name}" 프로젝트를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => meta?.onDelete?.(project.id)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
