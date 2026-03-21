import { NavigationProgress } from '@/shared/ui-kit/navigation-progress'
import { Outlet } from 'react-router-dom'

/**
 * 루트 레이아웃 컴포넌트
 * - 모든 라우트를 감싸는 최상위 레이아웃
 * - NavigationProgress를 포함하여 페이지 전환 시 로딩바 표시
 */
export function RootLayout() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
    </>
  )
}
