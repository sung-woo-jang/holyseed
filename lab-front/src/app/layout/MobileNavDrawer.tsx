import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronDown, FlaskConical, LogOut, X } from 'lucide-react'
import { SECTIONS, findActiveSection } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { clearTokens } from '@/shared/lib/storage'
import { useAuthStore } from '@/stores/auth.store'

export default function MobileNavDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const location = useLocation()
  const activeSection = findActiveSection(location.pathname)
  const [expandedId, setExpandedId] = useState<string | undefined>(activeSection?.id)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  async function handleLogoutButtonClick() {
    await clearTokens()
    logout()
    onOpenChange(false)
  }

  function handleNavLinkClick() {
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 lg:hidden"
        />
        <DialogPrimitive.Content
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[80vw] flex-col bg-sidebar duration-200 lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">메뉴</DialogPrimitive.Title>
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <Link
              to="/"
              onClick={handleNavLinkClick}
              className="flex items-center gap-2 text-primary"
            >
              <FlaskConical className="size-5" />
              <span className="text-sm font-semibold">Lab</span>
            </Link>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="메뉴 닫기">
                <X className="size-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {SECTIONS.map((section) => {
              const isSectionActive = activeSection?.id === section.id
              const isExpanded = expandedId === section.id
              return (
                <div key={section.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? undefined : section.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSectionActive && 'text-accent-foreground font-medium'
                    )}
                  >
                    <section.icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={cn('size-4 shrink-0 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 border-l pl-3">
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
                              onClick={handleNavLinkClick}
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
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 border-t p-3">
            {user && (
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            )}
            <span className="flex-1 truncate text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogoutButtonClick} aria-label="로그아웃">
              <LogOut className="size-4" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
