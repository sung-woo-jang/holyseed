import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** 모바일 카드 리스트의 세로 스택 래퍼 (데스크톱 Table을 대체) */
function RecordCardList({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />
}

/** 탭 가능한 카드 한 장의 껍데기 */
function RecordCard({
  className,
  onClick,
  ...props
}: React.ComponentProps<'div'> & { onClick?: () => void }) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter') onClick()
            }
          : undefined
      }
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors',
        onClick && 'cursor-pointer active:bg-accent/50',
        className
      )}
      {...props}
    />
  )
}

/** 카드 상단부 — 좌측 타이틀 영역 + 우측 강조값을 나란히 배치 */
function RecordCardRow({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-start justify-between gap-3', className)} {...props} />
}

/** 회색 보조 메타 정보 줄 (날짜·분류 등) */
function RecordCardMeta({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

export { RecordCard, RecordCardList, RecordCardMeta, RecordCardRow }
