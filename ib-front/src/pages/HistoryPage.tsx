import { useState } from 'react'
import { useStrategies, useExecutions, useStrategyState } from '@/queries/iv.queries'
import { fmtUSD, fmtDate, fmtT, MODE_LABEL, MODE_COLOR } from '@/lib/format'

const EXEC_LABEL: Record<string, string> = {
  buy_full: '1회 매수',
  buy_half_star: '별LOC 매수',
  buy_half_avg: '평단LOC 매수',
  sell_quarter: '쿼터매도',
  sell_fixed: '지정가매도',
  sell_moc: 'MOC 매도',
  no_exec: '미체결',
}

function StrategySummary({ id }: { id: string }) {
  const { data: state } = useStrategyState(id)
  if (!state) return null
  const mode = state.mode ?? 'cycle_start'
  return (
    <div
      style={{
        display: 'flex', gap: 12, padding: '10px 14px',
        background: 'var(--color-bg)', borderRadius: 10, marginBottom: 12, fontSize: 12,
      }}
    >
      <div>
        <span style={{ color: 'var(--color-text-secondary)' }}>T값 </span>
        <strong>{fmtT(state.tValue)}</strong>
      </div>
      <div>
        <span style={{ color: 'var(--color-text-secondary)' }}>평단 </span>
        <strong>{fmtUSD(state.avgPrice)}</strong>
      </div>
      <div>
        <span style={{ color: 'var(--color-text-secondary)' }}>보유 </span>
        <strong>{state.quantity}주</strong>
      </div>
      <div>
        <span
          style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 10,
            background: MODE_COLOR[mode] + '22', color: MODE_COLOR[mode], fontWeight: 700,
          }}
        >
          {MODE_LABEL[mode]}
        </span>
      </div>
    </div>
  )
}

function ExecutionList({ id }: { id: string }) {
  const { data: execs = [] } = useExecutions(id)

  if (execs.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 32 }}>
        체결 내역이 없습니다.
      </p>
    )
  }

  // 날짜별 그룹
  const grouped = execs.reduce<Record<string, typeof execs>>((acc, e) => {
    const key = e.execDate.slice(0, 7) // YYYY-MM
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <>
      {Object.entries(grouped).map(([month, list]) => (
        <div key={month}>
          <div
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)',
              padding: '8px 0 4px',
            }}
          >
            {month}
          </div>
          {list.map((e) => {
            const isBuy = e.execType.startsWith('buy')
            const stateAfter = e.stateAfter as Record<string, unknown>
            return (
              <div
                key={e.id}
                className="card"
                style={{ padding: '12px 14px', marginBottom: 4 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{EXEC_LABEL[e.execType] ?? e.execType}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {fmtDate(e.execDate)} · {e.execQty}주 @ {fmtUSD(e.execPrice)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 700, fontSize: 14,
                        color: isBuy ? 'var(--color-rise)' : 'var(--color-fall)',
                      }}
                    >
                      {isBuy ? '-' : '+'}{fmtUSD(e.execAmount)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      T={fmtT(stateAfter?.tValue as number)} · {stateAfter?.quantity as number}주
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

export function HistoryPage() {
  const { data: strategies = [] } = useStrategies()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? strategies[0]?.id ?? ''

  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      <h2 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 16px' }}>체결 내역</h2>

      {/* 전략 탭 */}
      {strategies.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                border: '1px solid var(--color-border)',
                background: activeId === s.id ? 'var(--color-primary)' : '#fff',
                color: activeId === s.id ? '#fff' : 'var(--color-text)',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              {s.ticker}
            </button>
          ))}
        </div>
      )}

      {activeId && <StrategySummary id={activeId} />}
      {activeId && <ExecutionList id={activeId} />}

      {strategies.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 40 }}>
          전략이 없습니다.
        </p>
      )}
    </div>
  )
}
