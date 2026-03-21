import { type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import styles from './styles.module.scss'

export interface PageHeaderProps {
  /**
   * 페이지 제목 (필수)
   * @example "예약 관리"
   */
  title: string

  /**
   * 페이지 설명 (선택)
   * @example "고객 예약을 조회하고 상태를 관리합니다."
   */
  description?: string

  /**
   * 우측 액션 영역 (선택)
   * @example <Button>추가</Button>
   */
  action?: ReactNode

  /**
   * 커스텀 className (선택)
   */
  className?: string
}

/**
 * PageHeader 위젯
 *
 * 페이지 상단에 표시되는 헤더 컴포넌트
 * 제목, 설명, 액션 버튼을 일관되게 표시합니다.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="예약 관리"
 *   description="고객 예약을 조회하고 상태를 관리합니다."
 * />
 * ```
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="서비스 관리"
 *   description="제공하는 서비스를 관리하고 지역별 출장비를 설정합니다."
 *   action={
 *     <Button onClick={handleCreate}>
 *       <Plus className='mr-2 size-4' />
 *       서비스 추가
 *     </Button>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(styles.pageHeader, className)}>
      <div className={styles.pageHeaderContent}>
        <h1 className={styles.pageHeaderTitle}>{title}</h1>
        {description && (
          <p className={styles.pageHeaderDescription}>{description}</p>
        )}
      </div>
      {action && <div className={styles.pageHeaderAction}>{action}</div>}
    </div>
  )
}
