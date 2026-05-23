import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { strategiesApi, cyclesApi } from '@/lib/iv-api'
import { keys, useStrategyState } from '@/queries/iv.queries'
import { fmtUSD, fmtT } from '@/lib/format'
import { BottomSheet } from '@/components/common/BottomSheet'
import type { IvStrategy } from '@/lib/iv-api'

const PRINCIPAL_INCREMENTS = [50, 100, 500, 1000]

interface Props {
  strategy: IvStrategy
  onClose: () => void
}

export function CycleEditSheet({ strategy, onClose }: Props) {
  const qc = useQueryClient()
  const { data: state } = useStrategyState(strategy.id)
  const [principal, setPrincipal] = useState(strategy.principal)
  const [division, setDivision] = useState<20 | 40>(strategy.division as 20 | 40)
  const [danger, setDanger] = useState(false)

  const tValue = state?.tValue ?? 0
  const isMidCycle = tValue > 0
  const changed = principal !== strategy.principal || division !== strategy.division

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
    <BottomSheet onClose={onClose}>
      {(requestClose) => (
        <div style={{ padding: '0 16px 32px' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{strategy.ticker} 설정</h3>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                사이클 {strategy.cycleNo} · {strategy.division}분할
              </div>
            </div>
            <button
              onClick={requestClose}
              style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px 8px' }}
            >
              ✕
            </button>
          </div>

          {/* 사이클 진행 중 경고 */}
          {isMidCycle && (
            <div
              style={{
                padding: '10px 12px', marginBottom: 16,
                background: 'var(--color-star-bg)', border: '1px solid #fbbf24',
                borderRadius: 10, fontSize: 12, color: '#d97706', fontWeight: 500,
              }}
            >
              사이클 진행 중 (T = {fmtT(tValue)}). 원금·분할수 변경은 다음 사이클부터 적용됩니다.
            </div>
          )}

          {/* 원금 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>원금 (USD)</label>
            <input
              type="number"
              inputMode="decimal"
              value={principal || ''}
              onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              style={{
                width: '100%', padding: '14px', fontSize: 20, fontWeight: 700,
                border: '2px solid var(--color-border)', borderRadius: 14,
                background: 'var(--color-card)', color: 'var(--color-text)',
                outline: 'none', marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {PRINCIPAL_INCREMENTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setPrincipal((v) => v + n)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)', color: 'var(--color-text)',
                    cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  }}
                >
                  +{n}
                </button>
              ))}
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 12, fontSize: 13 }}>
              1회 매수액: <strong>{fmtUSD(principal / division)}</strong>
            </div>
          </div>

          {/* 분할수 */}
          <div style={{ marginBottom: 16 }}>
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
                    background: division === d ? 'var(--color-avg-bg)' : 'var(--color-card)',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    color: division === d ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  <div>{d}분할</div>
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, color: 'var(--color-text-secondary)' }}>
                    {d === 20 ? '공격형' : '안정형'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !changed}
            style={{
              width: '100%', padding: '14px',
              background: changed ? 'var(--color-primary)' : 'var(--color-border)',
              color: changed ? '#fff' : 'var(--color-text-secondary)',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: changed ? 'pointer' : 'default',
              marginBottom: 20,
            }}
          >
            {updateMutation.isPending ? '저장 중...' : changed ? '변경사항 저장' : '변경된 내용 없음'}
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
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                  강제 종료: 현재 보유 수량과 무관하게 사이클을 종료합니다. 체결 없이 상태만 초기화됩니다.
                </p>
                <button
                  onClick={() => {
                    if (confirm(`${strategy.ticker} 사이클을 강제 종료할까요? 현재 보유·잔금 상태가 리셋됩니다.`)) {
                      forceEndMutation.mutate()
                    }
                  }}
                  disabled={forceEndMutation.isPending}
                  style={{
                    width: '100%', padding: '12px', background: 'var(--color-sell-bg)',
                    border: '1px solid #fca5a5', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, color: '#ef4444', cursor: 'pointer',
                  }}
                >
                  {forceEndMutation.isPending ? '종료 중...' : '사이클 강제 종료'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
