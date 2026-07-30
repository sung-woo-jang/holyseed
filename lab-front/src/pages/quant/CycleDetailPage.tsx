import { Link, useNavigate, useParams } from 'react-router-dom'
import { CycleChart } from '@/features/quant/ui/CycleChart'
import { CashChart, TChart } from '@/features/quant/ui/CycleCharts'
import { Tile } from '@/features/quant/ui/ui'
import { n, usd, kstDateOnly } from '@/features/quant/lib/types'
import { useStatus } from '@/features/quant/lib/useStatus'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'

export default function CycleDetailPage() {
  const { status } = useStatus()
  const { cycleNo } = useParams()
  const navigate = useNavigate()
  const isDesktop = useIsDesktopNav()

  if (!status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )

  const c = status.cycles.find((x) => x.cycleNo === Number(cycleNo))
  if (!c)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>
          {cycleNo}차 사이클 없음 — <Link to="/quant/cycles">사이클 목록</Link>
        </p>
      </main>
    )

  const real = c.trades.filter((t) => t.kind !== '이월')
  const buys = real.filter((t) => t.side === 'BUY').reduce((a, t) => a + n(t.amount), 0)
  const sells = real.filter((t) => t.side === 'SELL').reduce((a, t) => a + n(t.amount), 0)
  const last = real[real.length - 1]
  const days = last ? Math.round((new Date(last.date).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1 : 0
  const T = last ? n(last.tAfter) : 0

  return (
    <main className="wrap">
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap' }}>
        <Link to="/quant/cycles" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ← 사이클 목록
        </Link>
        <h1 style={{ fontSize: 18 }}>{c.cycleNo}차 사이클</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {kstDateOnly(c.startDate)} ~ {c.endDate ? kstDateOnly(c.endDate) : '진행 중'} ({days}일째)
        </span>
        {c.profit !== null && (
          <span style={{ fontWeight: 600, color: n(c.profit) >= 0 ? 'var(--delta-good)' : 'var(--status-critical)' }}>
            {n(c.profit) >= 0 ? '+' : ''}
            {usd(n(c.profit))} ({(n(c.profitPct) * 100).toFixed(2)}%)
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <Tile
          label="총 투입"
          value={usd(buys)}
          sub={`원금 ${usd(n(c.principal), 0)}의 ${((buys / n(c.principal)) * 100).toFixed(0)}%`}
        />
        <Tile label="총 회수" value={usd(sells)} />
        <Tile label="현재 T" value={String(T)} sub={`남은 회차 ${40 - T}`} />
        <Tile label="거래 횟수" value={`${real.length}차`} sub={`${days}일간`} />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px' }}>체결가 · 평단 추이</h3>
        <CycleChart trades={c.trades} />
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '16px 0 4px' }}>
          T값 진행 (20 = 후반전 진입)
        </h3>
        <TChart trades={c.trades} />
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '16px 0 4px' }}>자금 흐름</h3>
        <CashChart trades={c.trades} principal={n(c.principal)} />
      </div>

      <div className="card">
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          거래 내역 — 행 클릭 시 상세
        </h3>
        {isDesktop ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th className="l">m차</th>
                  <th className="l">날짜</th>
                  <th className="l">구분</th>
                  <th>체결가</th>
                  <th>수량</th>
                  <th>금액</th>
                  <th>T</th>
                  <th>평단</th>
                  <th>잔금</th>
                </tr>
              </thead>
              <tbody>
                {c.trades.map((t) => (
                  <tr
                    key={t.id}
                    title={t.note ?? undefined}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/quant/cycles/${c.cycleNo}/trades/${t.seq}`)}
                  >
                    <td className="l">{t.seq}</td>
                    <td className="l">{kstDateOnly(t.date)}</td>
                    <td className="l">
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginRight: 6,
                          background: t.side === 'SELL' ? 'var(--status-critical)' : 'var(--series-1)',
                        }}
                      />
                      {t.kind}
                    </td>
                    <td>{usd(n(t.price))}</td>
                    <td>{n(t.quantity).toFixed(6)}</td>
                    <td>{usd(n(t.amount))}</td>
                    <td>
                      {n(t.tBefore)} → {n(t.tAfter)}
                    </td>
                    <td>{usd(n(t.avgAfter))}</td>
                    <td>{usd(n(t.cashAfter))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rowcard-list">
            {c.trades.map((t) => (
              <div
                key={t.id}
                className="rowcard"
                onClick={() => navigate(`/quant/cycles/${c.cycleNo}/trades/${t.seq}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="rowcard-row">
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        marginRight: 6,
                        background: t.side === 'SELL' ? 'var(--status-critical)' : 'var(--series-1)',
                      }}
                    />
                    {t.seq}차 {t.kind} · {kstDateOnly(t.date)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{usd(n(t.amount))}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>잔금 {usd(n(t.cashAfter))}</div>
                  </div>
                </div>
                <div className="rowcard-meta">
                  <span>체결가 {usd(n(t.price))}</span>
                  <span>· 수량 {n(t.quantity).toFixed(6)}</span>
                  <span>
                    · T {n(t.tBefore)}→{n(t.tAfter)}
                  </span>
                  <span>· 평단 {usd(n(t.avgAfter))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
