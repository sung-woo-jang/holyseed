import { NavLink, useLocation } from 'react-router-dom'
import { findActiveSection } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'

export default function SecondarySidebar({ className }: { className?: string }) {
  const location = useLocation()
  const section = findActiveSection(location.pathname)

  if (!section) return <aside className={cn('border-r bg-sidebar', className)} />

  return (
    <aside className={cn('flex h-full flex-col border-r bg-sidebar', className)}>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <section.icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{section.label}</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {section.groups.map((group, i) => (
          <div key={group.label ?? i} className={cn('flex flex-col gap-1', i > 0 && 'mt-4 border-t pt-3')}>
            {section.groups.length > 1 && group.label && (
              <div className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
            )}
            {group.pages.map((page) => (
              <NavLink
                key={page.path}
                to={page.path}
                end={page.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'border-primary bg-accent font-medium text-accent-foreground'
                  )
                }
              >
                {page.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
