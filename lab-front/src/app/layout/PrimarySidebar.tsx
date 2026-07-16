import { Link, useLocation } from 'react-router-dom'
import { LogOut, FlaskConical } from 'lucide-react'
import { SECTIONS, findActiveSection } from '@/app/nav/sections'
import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Button } from '@/shared/ui/button'
import { clearTokens } from '@/shared/lib/storage'
import { useAuthStore } from '@/stores/auth.store'

export default function PrimarySidebar() {
  const location = useLocation()
  const activeSection = findActiveSection(location.pathname)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  async function handleLogoutButtonClick() {
    await clearTokens()
    logout()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full flex-col items-center gap-2 border-r bg-sidebar py-3">
        <Link to="/" className="mb-2 flex size-10 items-center justify-center rounded-lg text-primary">
          <FlaskConical className="size-6" />
        </Link>

        {SECTIONS.map((section) => {
          const isActive = activeSection?.id === section.id
          return (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <Link
                  to={section.pages[0]?.path ?? section.basePath}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <section.icon className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{section.label}</TooltipContent>
            </Tooltip>
          )
        })}

        <div className="mt-auto flex flex-col items-center gap-2">
          {user && (
            <div
              className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              title={user.name}
            >
              {user.name.charAt(0)}
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleLogoutButtonClick}>
                <LogOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">로그아웃</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
