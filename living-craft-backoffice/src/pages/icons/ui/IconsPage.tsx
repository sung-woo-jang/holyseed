import { useState } from 'react'
import type { IconAdminListItem } from '@/shared/types/api'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { useFetchIconsList } from '@/features/icons/api'
import { IconsTable, IconDialog } from '@/features/icons/ui'
import styles from './IconsPage.module.scss'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const

/**
 * 아이콘 관리 페이지
 */
export function IconsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const offset = (currentPage - 1) * pageSize

  const {
    data: iconsResponse,
    isLoading,
    error,
  } = useFetchIconsList({
    limit: pageSize,
    offset,
  })
  const data = iconsResponse?.data?.items
  const total = iconsResponse?.data?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedIcon, setSelectedIcon] = useState<IconAdminListItem>()

  const handleCreateIcon = () => {
    setDialogMode('create')
    setSelectedIcon(undefined)
    setDialogOpen(true)
  }

  const handleRowClick = (icon: IconAdminListItem) => {
    setDialogMode('edit')
    setSelectedIcon(icon)
    setDialogOpen(true)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1) // 페이지 크기 변경 시 1페이지로 리셋
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title='아이콘 관리'
        description='서비스 및 프로모션에서 사용되는 아이콘을 관리합니다.'
        action={
          <Button onClick={handleCreateIcon}>
            <Plus className='mr-2 size-4' />
            아이콘 추가
          </Button>
        }
      />

      {isLoading && (
        <div className={styles.centerMessage}>
          <div className='text-center'>
            <div className={styles.spinner}></div>
            <p className='text-muted-foreground'>아이콘을 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.centerMessage}>
          <p className='text-destructive'>아이콘을 불러오는데 실패했습니다.</p>
        </div>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <>
          {/* 상단 컨트롤 */}
          <div className={styles.tableControls}>
            <div className={styles.pageSizeSelector}>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className='w-[120px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}개씩 보기
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={styles.totalInfo}>
              총 {total.toLocaleString()}개 아이콘
            </div>
          </div>

          <IconsTable data={data} onRowClick={handleRowClick} />

          {/* 하단 페이지네이션 */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                페이지 {currentPage} / {totalPages}
              </div>
              <div className={styles.paginationControls}>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='size-4' />
                  이전
                </Button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  다음
                  <ChevronRight className='size-4' />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <IconDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        icon={selectedIcon}
        mode={dialogMode}
      />
    </div>
  )
}
