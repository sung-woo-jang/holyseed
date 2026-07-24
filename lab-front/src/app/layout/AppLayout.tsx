import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'
import MobileTopBar from './MobileTopBar'
import MobileNavDrawer from './MobileNavDrawer'

/**
 * 2중 사이드바 데스크톱 레이아웃 (lg 이상)
 * [1차: 섹션 아이콘 68px] [2차: 페이지 목록 220px] [콘텐츠]
 *
 * lg 미만(모바일)에서는 사이드바 대신 상단바+슬라이드 드로어로 전환
 */
export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:grid lg:grid-cols-[68px_220px_1fr]">
      <MobileTopBar className="lg:hidden" onMenuClick={() => setDrawerOpen(true)} />
      <PrimarySidebar className="hidden lg:flex" />
      <SecondarySidebar className="hidden lg:flex" />
      <MobileNavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
