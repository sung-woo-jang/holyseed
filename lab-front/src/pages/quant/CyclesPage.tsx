import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { n, usd, kstDateOnly } from '@/features/quant/lib/types'
import { useStatus } from '@/features/quant/lib/useStatus'

type StatusFilter = '전체' | '진행중' | '종료'
type SortKey = 'latest' | 'oldest'

export default function CyclesPage() {
  const { status } = useStatus()
  const [filter, setFilter] = useState<StatusFilter>('전체')
  const [sort, setSort] = useState<SortKey>('latest')

  const cycles = useMemo(() => {
    if (!status) return []
    const filtered = status.cycles.filter((c) => {
      if (filter === '진행중') return c.endDate === null
      if (filter === '종료') return c.endDate !== null
      return true
    })
    return [...filtered].sort((a, b) => (sort === 'latest' ? b.cycleNo - a.cycleNo : a.cycleNo - b.cycleNo))
  }, [status, filter, sort])

  if (!status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )

  return (
    <main className="wrap">
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>사이클 기록</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['전체', '진행중', '종료'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 700,
              borderColor: filter === f ? 'var(--series-1)' : 'var(--border)',
              color: filter === f ? 'var(--series-1)' : 'var(--text-secondary)',
              background: filter === f ? 'color-mix(in srgb, var(--series-1) 10%, var(--surface-1))' : 'var(--surface-1)',
            }}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => setSort((s) => (s === 'latest' ? 'oldest' : 'latest'))}
          style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)' }}
        >
          {sort === 'latest' ? '최신순 ↓' : '오래된순 ↑'}
        </button>
      </div>

      {cycles.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>조건에 맞는 사이클이 없어요.</p>
      ) : (
        cycles.map((c) => {
          const real = c.trades.filter((t) => t.kind !== '이월')
          const last = real[real.length - 1]
          const days = last
            ? Math.round((new Date(last.date).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1
            : 0
          const T = last ? n(last.tAfter) : 0
          return (
            <Link
              key={c.id}
              to={`/quant/cycles/${c.cycleNo}`}
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
                      T={T} · 남은 회차 {20 - T}
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
        })
      )}
    </main>
  )
}
