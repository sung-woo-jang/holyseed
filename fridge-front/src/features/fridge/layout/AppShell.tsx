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

  const items: { to: string; label: string; icon: ReactNode; sub: string; subCls: string }[] = [
    { to: '/', label: '홈', icon: <HomeIcon />, sub: '', subCls: '' },
    { to: '/calendar', label: '캘린더', icon: <CalIcon />, sub: todayCount ? `오늘 ${todayCount}` : '', subCls: '' },
    { to: '/ingredients', label: '재료', icon: <FridgeIcon />, sub: soon ? `임박 ${soon}` : '', subCls: 'coral' },
    { to: '/shopping', label: '장보기', icon: <CartIcon />, sub: shopLeft ? `${shopLeft}개` : '', subCls: '' },
  ]
  const settings = { to: '/settings', label: '설정', icon: <GearIcon size={26} />, sub: '', subCls: '' }

  return (
    <div className="relative flex h-full bg-bg">
      <nav className="hidden w-28 shrink-0 flex-col gap-2 bg-side px-3 py-5 lg:flex">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex h-24 flex-col items-center justify-center gap-1 rounded-[18px] ${
                isActive ? 'bg-amber text-bg' : 'text-sub'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {it.icon}
                <span className="text-[19px] font-semibold">{it.label}</span>
                <span
                  className={`h-[18px] whitespace-nowrap text-[15px] font-medium ${
                    isActive ? 'text-bg' : it.subCls === 'coral' ? 'text-coral' : 'text-sub'
                  }`}
                >
                  {it.sub}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to={settings.to}
          className={({ isActive }) =>
            `mt-auto flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[18px] ${
              isActive ? 'bg-amber text-bg' : 'text-sub'
            }`
          }
        >
          {settings.icon}
          <span className="text-[17px] font-semibold">{settings.label}</span>
        </NavLink>
      </nav>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:overflow-hidden lg:px-7 lg:py-6">
        <Outlet context={{ state, now }} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-side pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[...items, settings].map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `relative flex h-[68px] flex-1 flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-amber' : 'text-sub'
              }`
            }
          >
            <span className="[&>svg]:size-6">{it.icon}</span>
            <span className="text-[14px] font-semibold">{it.label}</span>
            {it.sub && (
              <span
                className={`absolute right-[18%] top-1.5 rounded-full px-1.5 text-[12px] font-bold leading-[18px] text-bg ${
                  it.subCls === 'coral' ? 'bg-coral' : 'bg-sub'
                }`}
              >
                {it.sub.replace('오늘 ', '').replace('임박 ', '').replace('개', '')}
              </span>
            )}
          </NavLink>
        ))}
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
