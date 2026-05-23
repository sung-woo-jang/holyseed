import { useRef, useState, useCallback } from 'react'
import { useStrategies, useRefreshPrice } from '@/queries/iv.queries'
import { useNavigate } from 'react-router-dom'
import { StrategyCard } from '@/components/card/StrategyCard'
import { PortfolioSummaryCard } from '@/components/card/PortfolioSummaryCard'

const PWA_HINT_KEY = 'iv-pwa-hint-dismissed'
const PULL_THRESHOLD = 60

function usePwaHint() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(PWA_HINT_KEY) === '1' } catch { return false }
  })
  const dismiss = useCallback(() => {
    setDismissed(true)
    try { localStorage.setItem(PWA_HINT_KEY, '1') } catch { /* noop */ }
  }, [])
  return { show: !dismissed, dismiss }
}

export function DashboardPage() {
  const { data: strategies = [], isLoading, refetch } = useStrategies()
  const nav = useNavigate()
  const refreshMutation = useRefreshPrice()
  const { show: showPwa, dismiss: dismissPwa } = usePwaHint()

  // pull-to-refresh
  const touchStartY = useRef<number | null>(null)
  const [pullDelta, setPullDelta] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const tickers = [...new Set(strategies.map((s) => s.ticker))]

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.all(tickers.map((t) => refreshMutation.mutateAsync(t)))
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, tickers, refreshMutation, refetch])

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartY.current == null || refreshing) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setPullDelta(Math.min(delta, PULL_THRESHOLD + 20))
  }

  async function onTouchEnd() {
    if (pullDelta >= PULL_THRESHOLD && !refreshing) {
      setPullDelta(0)
      touchStartY.current = null
      await handleRefresh()
    } else {
      setPullDelta(0)
      touchStartY.current = null
    }
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 6 ? '새벽' : hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁'

  const pullProgress = Math.min(pullDelta / PULL_THRESHOLD, 1)

  return (
    <div
      style={{ padding: 16, paddingBottom: 80, position: 'relative' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* pull-to-refresh indicator */}
      {(pullDelta > 0 || refreshing) && (
        <div
          style={{
            position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: refreshing ? 48 : Math.max(pullDelta, 0),
            transition: pullDelta === 0 ? 'height 0.2s' : 'none',
            overflow: 'hidden', width: '100%', maxWidth: 480,
            background: 'var(--color-bg)',
          }}
        >
          <div
            style={{
              width: 24, height: 24, borderRadius: 12,
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
              transform: refreshing ? 'none' : `rotate(${pullProgress * 270}deg)`,
              transition: pullDelta === 0 ? 'none' : undefined,
            }}
          />
        </div>
      )}

      <header style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} · {greeting}
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>자동매매 대시보드</h1>
      </header>

      {/* PWA install hint */}
      {showPwa && (
        <div
          style={{
            marginBottom: 12, padding: '12px 14px',
            background: 'var(--color-avg-bg)', border: '1px solid var(--color-primary)',
            borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)', marginBottom: 2 }}>
              홈화면에 추가하기
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              Safari → 공유 → 홈 화면에 추가
            </div>
          </div>
          <button
            onClick={dismissPwa}
            style={{
              background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
              color: 'var(--color-text-secondary)', padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 포트폴리오 요약 */}
      <PortfolioSummaryCard />

      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--color-text)', fontWeight: 700 }}>
        오늘 운용 · {strategies.length}개 전략
      </div>

      {isLoading && (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 40 }}>로딩 중...</p>
      )}

      {!isLoading && strategies.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          <p style={{ marginBottom: 16 }}>아직 전략이 없습니다.</p>
          <button
            onClick={() => nav('/strategy/new')}
            style={{
              background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 12, padding: '12px 24px',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + 첫 전략 추가
          </button>
        </div>
      )}

      {strategies.map((s) => (
        <StrategyCard key={s.id} strategy={s} />
      ))}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
