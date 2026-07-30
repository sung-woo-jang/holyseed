import { NavLink, useLocation } from 'react-router-dom'
import { findActiveSection } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'

/**
 * 모바일 2차 내비게이션 — 데스크톱 SecondarySidebar(섹션 내 페이지 목록)에 대응.
 * 활성 섹션의 페이지들을 가로 스크롤 pill로 나열한다.
 */
export default function MobileTopBar({ className }: { className?: string }) {
  const location = useLocation()
  const section = findActiveSection(location.pathname)
  if (!section) return null

  const showGroupLabel = section.groups.length > 1

  return (
    <div className={cn('flex h-12 shrink-0 items-center gap-1.5 overflow-x-auto border-b bg-sidebar px-3 no-scrollbar', className)}>
      {section.groups.map((group, i) => (
        <div key={group.label ?? i} className="flex shrink-0 items-center gap-1.5">
          {i > 0 && <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />}
          {showGroupLabel && group.label && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
          )}
          {group.pages.map((page) => (
            <NavLink
              key={page.path}
              to={page.path}
              end={page.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                    : 'border-transparent hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              {page.label}
            </NavLink>
          ))}
        </div>
      ))}
    </div>
  )
}
