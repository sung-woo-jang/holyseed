import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { fmtUSD } from '@/lib/format'

interface PortfolioSummary {
  totalPrincipal: number
  totalCash: number
  totalStockValue: number
  totalEvaluation: number
  totalPnl: number
  totalPnlPct: number
  count: number
}

function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get('/iv/strategies/portfolio').then(unwrap<PortfolioSummary>),
    staleTime: 1000 * 30,
  })
}

export function PortfolioSummaryCard() {
  const { data, isLoading } = usePortfolio()

  if (isLoading || !data) return null
  if (data.count === 0) return null

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* 총 평가금액 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>총 평가금액</div>
        <span style={{ fontSize: 26, fontWeight: 800 }}>{fmtUSD(data.totalEvaluation)}</span>
      </div>

      {/* 투입 원금 / 현금 잔금 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          paddingTop: 10,
          borderTop: '1px solid var(--color-border)',
          gap: 8,
        }}
      >
        {[
          { label: '투입 원금', value: fmtUSD(data.totalPrincipal) },
          { label: '현금 잔금', value: fmtUSD(data.totalCash) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
