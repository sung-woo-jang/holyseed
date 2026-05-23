import { useState } from 'react'
import { useStrategies, useExecutions, useStrategyState, useDeleteExecution, useUpdateExecution } from '@/queries/iv.queries'
import { fmtUSD, fmtDate, fmtT, MODE_LABEL, MODE_COLOR } from '@/lib/format'
import type { IvExecution } from '@/lib/iv-api'

const EXEC_LABEL: Record<string, string> = {
  buy_full: '1회 매수',
  buy_half_star: '별LOC 매수',
  buy_half_avg: '평단LOC 매수',
  sell_quarter: '쿼터 매도',
  sell_fixed: '지정가 매도',
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
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 10,
        marginBottom: 12, fontSize: 12,
      }}
    >
      <div><span style={{ color: 'var(--color-text-secondary)' }}>T값 </span><strong>{fmtT(state.tValue)}</strong></div>
      <div><span style={{ color: 'var(--color-text-secondary)' }}>평단 </span><strong>{fmtUSD(state.avgPrice)}</strong></div>
      <div><span style={{ color: 'var(--color-text-secondary)' }}>보유 </span><strong>{state.quantity}주</strong></div>
      <div><span style={{ color: 'var(--color-text-secondary)' }}>잔금 </span><strong>{fmtUSD(state.cash)}</strong></div>
      <span
        style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 10,
          background: MODE_COLOR[mode] + '22', color: MODE_COLOR[mode], fontWeight: 700,
        }}
      >
        {MODE_LABEL[mode]}
      </span>
    </div>
  )
}

export function ExecCard({ exec, strategyId }: { exec: IvExecution; strategyId: string }) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(String(exec.execPrice ?? ''))
  const [qty, setQty] = useState(String(exec.execQty ?? ''))

  const deleteMut = useDeleteExecution(strategyId)
  const updateMut = useUpdateExecution(strategyId)

  const isBuy = exec.execType.startsWith('buy')
  const isSell = exec.execType.startsWith('sell')
  const stateBefore = exec.stateBefore as Record<string, unknown>
  const stateAfter = exec.stateAfter as Record<string, unknown>
  const tBefore = stateBefore?.tValue as number | undefined
  const tAfter = stateAfter?.tValue as number | undefined
  const qtyAfter = stateAfter?.quantity as number | undefined

  async function handleDelete() {
    if (!confirm(`이 체결을 삭제하시겠습니까?\n${EXEC_LABEL[exec.execType]} · ${fmtDate(exec.execDate)}`)) return
    await deleteMut.mutateAsync(exec.id)
  }

  async function handleSave() {
    const p = parseFloat(price)
    const q = parseFloat(qty)
    if (!p || !q) return
    await updateMut.mutateAsync({ execId: exec.id, price: p, qty: q })
    setEditing(false)
  }

  const badge = isBuy
    ? { label: '매수', bg: 'var(--color-avg-bg)', color: 'var(--color-fall)' }
    : isSell
      ? { label: '매도', bg: 'var(--color-sell-bg)', color: '#dc2626' }
      : { label: '미체결', bg: 'var(--color-bg)', color: 'var(--color-text-secondary)' }

  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 10 }}>
      {/* 상단 행: 뱃지 + execType + 날짜 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12, padding: '3px 9px', borderRadius: 10, fontWeight: 700,
              background: badge.bg, color: badge.color,
            }}
          >
            {badge.label}
          </span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{EXEC_LABEL[exec.execType] ?? exec.execType}</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{fmtDate(exec.execDate)}</span>
      </div>

      {/* 가격·수량 행 */}
      {exec.execType !== 'no_exec' && (
        editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>체결가 ($)</label>
              <input
                type="number" step="0.01" value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>수량 (주)</label>
              <input
                type="number" step="0.000001" value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            {exec.execQty}주 @ {fmtUSD(exec.execPrice)}
            <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--color-text)' }}>
              = {fmtUSD(exec.execAmount)}
            </span>
          </div>
        )
      )}

      {/* T 변화 + 보유 행 */}
      {tBefore !== undefined && tAfter !== undefined && (
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          T {fmtT(tBefore)} → <strong style={{ color: 'var(--color-text)' }}>{fmtT(tAfter)}</strong>
          {qtyAfter !== undefined && (
            <span style={{ marginLeft: 8 }}>· {qtyAfter}주 보유</span>
          )}
        </div>
      )}

      {exec.note && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: 6 }}>
          {exec.note}
        </div>
      )}

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        {editing ? (
          <>
            <button
              onClick={() => { setEditing(false); setPrice(String(exec.execPrice ?? '')); setQty(String(exec.execQty ?? '')) }}
              style={{
                padding: '9px 18px', borderRadius: 10, border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 600,
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={updateMut.isPending}
              style={{
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: 13, cursor: 'pointer', fontWeight: 700,
              }}
            >
              {updateMut.isPending ? '저장 중...' : '저장'}
            </button>
          </>
        ) : (
          <>
            {exec.execType !== 'no_exec' && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '9px 18px', borderRadius: 10, border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)', fontSize: 13, cursor: 'pointer', color: 'var(--color-text)', fontWeight: 600,
                }}
              >
                수정
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              style={{
                padding: '9px 18px', borderRadius: 10, border: '1px solid #fecaca',
                background: 'var(--color-bg)', fontSize: 13, cursor: 'pointer', color: '#dc2626', fontWeight: 600,
              }}
            >
              {deleteMut.isPending ? '삭제 중...' : '삭제'}
            </button>
          </>
        )}
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

  const grouped = execs.reduce<Record<string, typeof execs>>((acc, e) => {
    const key = e.execDate.slice(0, 7)
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
              fontSize: 13, fontWeight: 700, color: 'var(--color-text)',
              padding: '12px 0 6px',
            }}
          >
            {month}
          </div>
          {list.map((e) => (
            <ExecCard key={e.id} exec={e} strategyId={id} />
          ))}
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

      {strategies.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              style={{
                padding: '8px 18px', borderRadius: 20, whiteSpace: 'nowrap',
                border: '1px solid var(--color-border)',
                background: activeId === s.id ? 'var(--color-primary)' : 'var(--color-bg)',
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
