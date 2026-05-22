import { useStrategies } from '@/queries/iv.queries'
import { useNavigate } from 'react-router-dom'
import { StrategyCard } from '@/components/card/StrategyCard'
import { PortfolioSummaryCard } from '@/components/card/PortfolioSummaryCard'

export function DashboardPage() {
  const { data: strategies = [], isLoading } = useStrategies()
  const nav = useNavigate()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 6 ? '새벽' : hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁'

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} · {greeting}
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>자동매매 대시보드</h1>
      </header>

      {/* 포트폴리오 요약 */}
      <PortfolioSummaryCard />

      <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
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
    </div>
  )
}
