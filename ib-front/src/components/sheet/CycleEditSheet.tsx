import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { strategiesApi, cyclesApi } from '@/lib/iv-api'
import { keys } from '@/queries/iv.queries'
import type { IvStrategy } from '@/lib/iv-api'

interface Props {
  strategy: IvStrategy
  onClose: () => void
}

export function CycleEditSheet({ strategy, onClose }: Props) {
  const qc = useQueryClient()
  const [principal, setPrincipal] = useState(strategy.principal)
  const [division, setDivision] = useState<20 | 40>(strategy.division as 20 | 40)
  const [danger, setDanger] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => strategiesApi.update(strategy.id, { principal, division }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.strategy(strategy.id) })
      qc.invalidateQueries({ queryKey: keys.strategies })
      onClose()
    },
  })

  const forceEndMutation = useMutation({
    mutationFn: () => cyclesApi.forceEnd(strategy.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.strategies })
      qc.invalidateQueries({ queryKey: keys.state(strategy.id) })
      qc.invalidateQueries({ queryKey: keys.plan(strategy.id) })
      onClose()
    },
  })

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '20px 16px 32px', zIndex: 101, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{strategy.ticker} 설정</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        {/* 원금 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>원금 (USD)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
            style={{
              width: '100%', padding: '12px', border: '1px solid var(--color-border)',
              borderRadius: 12, fontSize: 16, fontWeight: 700,
            }}
          />
        </div>

        {/* 분할수 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>분할수</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {([20, 40] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDivision(d)}
                style={{
                  flex: 1, padding: '12px',
                  border: `2px solid ${division === d ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 12,
                  background: division === d ? '#f0f6ff' : '#fff',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  color: 'var(--color-text)',
                }}
              >
                {d}분할
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          style={{
            width: '100%', padding: '14px', background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 20,
          }}
        >
          {updateMutation.isPending ? '저장 중...' : '저장'}
        </button>

        {/* 위험 구역 */}
        <div style={{ border: '1px solid #fee2e2', borderRadius: 12, padding: 16 }}>
          <button
            onClick={() => setDanger(!danger)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 13, fontWeight: 600, color: '#ef4444', padding: 0,
            }}
          >
            위험 구역
            <span>{danger ? '▲' : '▼'}</span>
          </button>

          {danger && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                강제 종료: 현재 보유 수량과 무관하게 사이클을 종료합니다. 체결 없이 상태만 초기화됩니다.
              </p>
              <button
                onClick={() => {
                  if (confirm(`${strategy.ticker} 사이클을 강제 종료할까요? 현재 수익/손실이 확정됩니다.`)) {
                    forceEndMutation.mutate()
                  }
                }}
                disabled={forceEndMutation.isPending}
                style={{
                  width: '100%', padding: '12px', background: '#fef2f2',
                  border: '1px solid #fca5a5', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, color: '#ef4444', cursor: 'pointer', marginBottom: 8,
                }}
              >
                사이클 강제 종료
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
