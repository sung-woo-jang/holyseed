import { Outlet } from 'react-router-dom'
import PrimarySidebar from './PrimarySidebar'
import SecondarySidebar from './SecondarySidebar'

/**
 * 2중 사이드바 데스크톱 레이아웃
 * [1차: 섹션 아이콘 68px] [2차: 페이지 목록 220px] [콘텐츠]
 */
export default function AppLayout() {
  return (
    <div className="grid h-screen grid-cols-[68px_220px_1fr] overflow-hidden">
      <PrimarySidebar />
      <SecondarySidebar />
      <main className="overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
