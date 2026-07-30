import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'
import MobileTopBar from './MobileTopBar'
import MobileBottomTabBar from './MobileBottomTabBar'
import MobileNavDrawer from './MobileNavDrawer'

/**
 * 2중 사이드바 데스크톱 레이아웃 (lg 이상)
 * [1차: 섹션 아이콘 68px] [2차: 페이지 목록 220px] [콘텐츠]
 *
 * lg 미만(모바일)에서는 같은 위계를 하단 탭바(1차)+상단 pill 바(2차)로 전환.
 * "더보기" 탭은 전체 페이지 목록 드로어(MobileNavDrawer)를 연다.
 */
export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:grid lg:grid-cols-[68px_220px_1fr]">
      <MobileTopBar className="lg:hidden" />
      <PrimarySidebar className="hidden lg:flex" />
      <SecondarySidebar className="hidden lg:flex" />
      <MobileNavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <Outlet />
      </main>
      <MobileBottomTabBar className="lg:hidden" onMoreClick={() => setDrawerOpen(true)} />
    </div>
  )
}
