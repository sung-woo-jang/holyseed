import { format } from 'date-fns'
import type { PromotionAdmin } from '@/shared/types/api'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Switch } from '@/shared/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { ko } from 'date-fns/locale'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Link,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/widgets/page-header'
import {
  useFetchPromotions,
  useDeletePromotion,
  useTogglePromotion,
} from '@/features/promotions/api'
import styles from './PromotionsPage.module.scss'

/**
 * 프로모션 배너 관리 페이지
 */
export function PromotionsPage() {
  const navigate = useNavigate()
  const { data: promotionsResponse, isLoading, error } = useFetchPromotions()
  const data = promotionsResponse?.data
  const togglePromotion = useTogglePromotion()
  const deletePromotion = useDeletePromotion()

  const handleCreatePromotion = () => {
    navigate('/promotions/new')
  }

  const handleEdit = (id: number) => {
    navigate(`/promotions/${id}/edit`)
  }

  const handleToggle = async (id: number) => {
    await togglePromotion.mutateAsync(id)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('정말 이 프로모션을 삭제하시겠습니까?')) {
      await deletePromotion.mutateAsync(id)
    }
  }

  const formatDateRange = (
    startDate: string | null,
    endDate: string | null
  ) => {
    if (!startDate && !endDate) return '기간 없음'
    const start = startDate
      ? format(new Date(startDate), 'yyyy.MM.dd', { locale: ko })
      : '시작일 없음'
    const end = endDate
      ? format(new Date(endDate), 'yyyy.MM.dd', { locale: ko })
      : '종료일 없음'
    return `${start} ~ ${end}`
  }

  const getLinkTypeBadge = (linkType: string, linkUrl: string | null) => {
    if (!linkUrl) return <Badge variant='outline'>링크 없음</Badge>
    if (linkType === 'external') {
      return (
        <Badge variant='secondary'>
          <ExternalLink className='mr-1 size-3' />
          외부 링크
        </Badge>
      )
    }
    return (
      <Badge variant='default'>
        <Link className='mr-1 size-3' />앱 내 이동
      </Badge>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title='프로모션 배너 관리'
        description='홈 화면에 표시되는 프로모션 배너를 관리합니다.'
        action={
          <Button onClick={handleCreatePromotion}>
            <Plus className='mr-2 size-4' />
            배너 추가
          </Button>
        }
      />

      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>프로모션을 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p>프로모션을 불러오는데 실패했습니다.</p>
        </div>
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className={styles.tableContainer}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[60px]'>순서</TableHead>
                <TableHead className='w-[80px]'>아이콘</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>링크</TableHead>
                <TableHead>게시 기간</TableHead>
                <TableHead className='text-center'>클릭 수</TableHead>
                <TableHead className='w-[80px] text-center'>활성</TableHead>
                <TableHead className='w-[80px]'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((promotion: PromotionAdmin) => (
                <TableRow
                  key={promotion.id}
                  className='hover:bg-muted/50 cursor-pointer'
                  onClick={() => handleEdit(promotion.id)}
                >
                  <TableCell className='font-medium'>
                    {promotion.sortOrder}
                  </TableCell>
                  <TableCell>
                    {promotion.icon ? (
                      <div className={styles.iconCell}>
                        <div
                          className={styles.iconColor}
                          style={{ backgroundColor: promotion.iconBgColor }}
                          title={`배경: ${promotion.iconBgColor}`}
                        >
                          <span
                            style={{ color: promotion.iconColor }}
                            title={`아이콘: ${promotion.iconColor}`}
                          >
                            ●
                          </span>
                        </div>
                        <span className={styles.iconName}>
                          {promotion.icon.name}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.noIcon}>-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={styles.titleCell}>
                      <span className={styles.promotionTitle}>
                        {promotion.title}
                      </span>
                      {promotion.subtitle && (
                        <span className={styles.promotionSubtitle}>
                          {promotion.subtitle}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getLinkTypeBadge(promotion.linkType, promotion.linkUrl)}
                  </TableCell>
                  <TableCell>
                    <span className={styles.dateRange}>
                      {formatDateRange(promotion.startDate, promotion.endDate)}
                    </span>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Badge variant='outline'>
                      {promotion.clickCount.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-center'>
                    <Switch
                      checked={promotion.isActive}
                      onCheckedChange={() => handleToggle(promotion.id)}
                      disabled={togglePromotion.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreHorizontal className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => handleEdit(promotion.id)}
                        >
                          <Pencil className='mr-2 size-4' />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(promotion.id)}
                          className='text-destructive'
                        >
                          <Trash2 className='mr-2 size-4' />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className={styles.emptyContainer}>
          <p>등록된 프로모션 배너가 없습니다.</p>
          <Button onClick={handleCreatePromotion} variant='outline'>
            <Plus className='mr-2 size-4' />첫 배너 추가하기
          </Button>
        </div>
      )}
    </div>
  )
}
