import { NavLink, useLocation } from 'react-router-dom'
import { findActiveSection } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'

export default function SecondarySidebar() {
  const location = useLocation()
  const section = findActiveSection(location.pathname)

  if (!section) return <aside className="border-r bg-sidebar" />

  return (
    <aside className="flex h-full flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <section.icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{section.label}</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {section.pages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            end={page.end}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent font-medium text-accent-foreground'
              )
            }
          >
            {page.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
