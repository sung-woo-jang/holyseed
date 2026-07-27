import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { findActiveSection, sectionPages } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

export default function MobileTopBar({
  className,
  onMenuClick,
}: {
  className?: string
  onMenuClick: () => void
}) {
  const location = useLocation()
  const section = findActiveSection(location.pathname)
  const page = section ? sectionPages(section).find((p) => p.path === location.pathname) : undefined
  const title = section ? (page ? `${section.label} · ${page.label}` : section.label) : ''

  return (
    <div className={cn('flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar px-3', className)}>
      <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="메뉴 열기">
        <Menu className="size-5" />
      </Button>
      {section && (
        <div className="flex items-center gap-2">
          <section.icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
      )}
    </div>
  )
}
