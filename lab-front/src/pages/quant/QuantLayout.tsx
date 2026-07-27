import { Outlet } from 'react-router-dom'
import { StatusProvider } from '@/features/quant/lib/StatusContext'
import '@/features/quant/quant-scope.css'

/**
 * 라오어(무한매수법) 섹션 전용 래퍼:
 * - .quant-scope — 이식한 라오어 전역 스타일(태그 리셋 포함)을 이 서브트리에만 적용
 * - StatusProvider — SSE(/api/laofus/stream) 연결을 이 섹션에서만 유지
 */
export default function QuantLayout() {
  return (
    <div className="quant-scope">
      <StatusProvider>
        <Outlet />
      </StatusProvider>
    </div>
  )
}
