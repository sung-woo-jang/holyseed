import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStrategies, useDeleteStrategy, useRefreshPrice } from '@/queries/iv.queries'
import { fmtUSD } from '@/lib/format'
import { CycleEditSheet } from '@/components/sheet/CycleEditSheet'
import type { IvStrategy } from '@/lib/iv-api'

export function AccountPage() {
  const nav = useNavigate()
  const { data: strategies = [] } = useStrategies()
  const deleteMutation = useDeleteStrategy()
  const refreshMutation = useRefreshPrice()
  const [editTarget, setEditTarget] = useState<IvStrategy | null>(null)

  const tickers = [...new Set(strategies.map((s) => s.ticker))]

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <h2 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 24px' }}>계정</h2>

      {/* 전략 목록 */}
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
        전략 운용
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        {strategies.length === 0 && (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', margin: '16px 0' }}>
            전략이 없습니다.
          </p>
        )}
        {strategies.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < strategies.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.ticker}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                사이클 {s.cycleNo} · {s.division}분할 · {fmtUSD(s.principal)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setEditTarget(s)}
                style={{
                  background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)',
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
                }}
              >
                설정
              </button>
              <button
                onClick={() => {
                  if (confirm(`${s.ticker} 전략을 삭제할까요?`)) {
                    deleteMutation.mutate(s.id)
                  }
                }}
                style={{
                  background: 'none', border: '1px solid #fca5a5', color: '#ef4444',
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => nav('/strategy/new')}
          style={{
            display: 'block', width: '100%', marginTop: 12, padding: '12px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + 전략 추가
        </button>
      </div>

      {/* 앱 설정 */}
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
        시세 갱신
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        {(tickers.length > 0 ? tickers : ['TQQQ', 'SOXL']).map((ticker, i, arr) => (
          <button
            key={ticker}
            onClick={() => refreshMutation.mutate(ticker)}
            disabled={refreshMutation.isPending}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', padding: '13px 0',
              background: 'none', border: 'none', textAlign: 'left',
              borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
              cursor: 'pointer', color: 'var(--color-text)', fontSize: 14,
            }}
          >
            <span>{ticker} 시세 새로고침</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {refreshMutation.isPending ? '갱신 중...' : '→'}
            </span>
          </button>
        ))}
      </div>

      {/* 정보 */}
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 32 }}>
        무한매수법 자동매매 v0.1.0 · 라오어 V4.0 기반
      </div>

      {/* CycleEditSheet */}
      {editTarget && (
        <CycleEditSheet strategy={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  )
}
