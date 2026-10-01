import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { CalIcon, CartIcon, FridgeIcon, GearIcon, HomeIcon } from '@/components/icons'
import { Splash, btnGhost } from '@/components/ui'
import { useUiStore } from '@/stores/ui.store'
import { eventsOn } from '../lib/calendar'
import { todayIso } from '../lib/date'
import { toIngredientViews } from '../lib/expiry'
import { isNight } from '../lib/night'
import { useFridgeState } from '../hooks/useFridge'
import { useNow } from '../hooks/useNow'
import SheetHost from '../sheets/SheetHost'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  badge?: number
  urgent?: boolean
}

function Badge({ item, className = '' }: { item: NavItem; className?: string }) {
  if (!item.badge) return null
  return (
    <span
      className={`min-w-[22px] rounded-full px-1.5 text-center text-[13px] font-bold leading-[22px] text-bg ${
        item.urgent ? 'bg-coral' : 'bg-sub'
      } ${className}`}
    >
      {item.badge}
    </span>
  )
}

function SideItem({ item, className = '' }: { item: NavItem; className?: string }) {
  return (
    <li className={className}>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-1.5 rounded-[18px] px-1 py-4 ${isActive ? 'bg-amber text-bg' : 'text-sub'}`
        }
      >
        {item.icon}
        <span className="text-[18px] font-semibold leading-none">{item.label}</span>
        <Badge item={item} className="absolute right-2 top-2" />
      </NavLink>
    </li>
  )
}

export default function AppShell() {
  const q = useFridgeState()
  const now = useNow()
  const toast = useUiStore((s) => s.toast)

  if (q.isPending) return <Splash />
  if (q.isError || !q.data) {
    return (
      <Splash>
        <div className="text-[22px]">데이터를 불러오지 못했어요</div>
        <button className={btnGhost} onClick={() => q.refetch()}>
          다시 시도
        </button>
      </Splash>
    )
  }

  const state = q.data
  const today = todayIso()
  const multi = state.people.length > 1
  const todayCount = eventsOn(state.events, today, 'all', multi).length
  const soon = toIngredientViews(state.ingredients).filter((x) => x.d <= 3).length
  const shopLeft = state.shop.filter((x) => !x.done).length

  const items: NavItem[] = [
    { to: '/', label: '홈', icon: <HomeIcon /> },
    { to: '/calendar', label: '캘린더', icon: <CalIcon />, badge: todayCount || undefined },
    { to: '/ingredients', label: '재료', icon: <FridgeIcon />, badge: soon || undefined, urgent: true },
    { to: '/shopping', label: '장보기', icon: <CartIcon />, badge: shopLeft || undefined },
  ]
  const settings: NavItem = { to: '/settings', label: '설정', icon: <GearIcon size={26} /> }

  return (
    <div className="relative flex h-full bg-bg">
      <nav className="hidden w-28 shrink-0 bg-side px-3 py-5 lg:flex lg:flex-col" aria-label="주 메뉴">
        <ul className="flex flex-1 flex-col gap-2">
          {items.map((it) => (
            <SideItem key={it.to} item={it} />
          ))}
          <SideItem item={settings} className="mt-auto" />
        </ul>
      </nav>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:overflow-hidden lg:px-7 lg:py-6">
        <Outlet context={{ state, now }} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-side pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="주 메뉴">
        <ul className="flex">
          {[...items, settings].map((it) => (
            <li key={it.to} className="flex-1">
              <NavLink
                to={it.to}
                end={it.to === '/'}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 py-2.5 ${isActive ? 'text-amber' : 'text-sub'}`
                }
              >
                <span className="[&>svg]:size-6">{it.icon}</span>
                <span className="text-[14px] font-semibold">{it.label}</span>
                <Badge item={it} className="absolute right-[18%] top-1.5" />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <SheetHost state={state} />

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-40 max-w-[92vw] -translate-x-1/2 truncate rounded-full bg-ink px-6 py-3.5 text-[20px] font-semibold text-bg shadow-[0_8px_30px_rgba(0,0,0,.4)] lg:bottom-8">
          {toast}
        </div>
      )}

      {isNight(state.settings.nightMode, now) && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-black/50" />
      )}
    </div>
  )
}
