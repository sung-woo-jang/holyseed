import { Link } from 'react-router-dom'
import { n, usd, kstDateOnly } from '@/lib/types'
import { useStatus } from '@/lib/useStatus'

export default function CyclesPage() {
  const { status } = useStatus()

  if (!status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )

  return (
    <main className="wrap">
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>사이클 기록</h1>
      {status.cycles.map((c) => {
        const real = c.trades.filter((t) => t.kind !== '이월')
        const last = real[real.length - 1]
        const days = last
          ? Math.round((new Date(last.date).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1
          : 0
        const T = last ? n(last.tAfter) : 0
        return (
          <Link
            key={c.id}
            to={`/cycles/${c.cycleNo}`}
            style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 12 }}
          >
            <div className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong>{c.cycleNo}차 사이클</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {kstDateOnly(c.startDate)} ~ {c.endDate ? kstDateOnly(c.endDate) : '진행 중'} ({days}일째)
                </span>
                {!c.endDate && (
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    T={T} · 남은 회차 {40 - T}
                  </span>
                )}
                {c.profit !== null && (
                  <span
                    style={{
                      fontWeight: 600,
                      color: n(c.profit) >= 0 ? 'var(--delta-good)' : 'var(--status-critical)',
                    }}
                  >
                    {n(c.profit) >= 0 ? '+' : ''}
                    {usd(n(c.profit))} ({(n(c.profitPct) * 100).toFixed(2)}%)
                  </span>
                )}
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>
                  {real.length}차 거래 →
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </main>
  )
}
