import { Outlet } from 'react-router-dom'
import { StatusProvider } from '@/features/laofus/lib/StatusContext'
import '@/features/laofus/laofus-scope.css'

/**
 * laofus 섹션 전용 래퍼:
 * - .laofus-scope — 이식한 laofus 전역 스타일(태그 리셋 포함)을 이 서브트리에만 적용
 * - StatusProvider — SSE(/api/laofus/stream) 연결을 laofus 섹션에서만 유지
 */
export default function LaofusLayout() {
  return (
    <div className="laofus-scope">
      <StatusProvider>
        <Outlet />
      </StatusProvider>
    </div>
  )
}
