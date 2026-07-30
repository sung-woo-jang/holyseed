import { Link, useLocation } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { SECTIONS, findActiveSection, sectionPages } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'

/**
 * 모바일 1차 내비게이션 — 데스크톱 PrimarySidebar(섹션 아이콘)에 대응.
 * 섹션 탭 + 마지막 "더보기" 탭(전체 페이지 목록 드로어를 염)으로 구성.
 */
export default function MobileBottomTabBar({
  className,
  onMoreClick,
}: {
  className?: string
  onMoreClick: () => void
}) {
  const location = useLocation()
  const activeSection = findActiveSection(location.pathname)

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-sidebar pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      {SECTIONS.map((section) => {
        const isActive = activeSection?.id === section.id
        const firstPage = sectionPages(section)[0]
        return (
          <Link
            key={section.id}
            to={firstPage.path}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground',
              isActive && 'text-primary'
            )}
          >
            <section.icon className="size-5" />
            <span className="text-[11px] font-medium">{section.label}</span>
          </Link>
        )
      })}
      <button
        type="button"
        onClick={onMoreClick}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground"
      >
        <MoreHorizontal className="size-5" />
        <span className="text-[11px] font-medium">더보기</span>
      </button>
    </nav>
  )
}
