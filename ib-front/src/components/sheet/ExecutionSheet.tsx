import { useState } from 'react'
import { useCreateExecution } from '@/queries/iv.queries'
import { fmtUSD, fmtT } from '@/lib/format'
import type { IvStrategy, IvState, DailyPlan, FillRowInput } from '@/lib/iv-api'

const EXEC_TYPES: { value: string; label: string; side: 'buy' | 'sell' | 'none' }[] = [
  { value: 'buy_full', label: '1회 매수', side: 'buy' },
  { value: 'buy_half_star', label: '별LOC 매수 (1/2)', side: 'buy' },
  { value: 'buy_half_avg', label: '평단LOC 매수 (1/2)', side: 'buy' },
  { value: 'sell_quarter', label: '쿼터 매도', side: 'sell' },
  { value: 'sell_fixed', label: '지정가 매도', side: 'sell' },
  { value: 'sell_moc', label: 'MOC 매도', side: 'sell' },
  { value: 'no_exec', label: '미체결', side: 'none' },
]

interface Row {
  execType: string
  price: string
  qty: string
  note: string
}

interface CloseResult {
  cycleEnded: boolean
  profit?: number
  profitPct?: number
}

interface Props {
  strategy: IvStrategy
  state: IvState | null
  plan: DailyPlan | null
  onClose: (result?: CloseResult) => void
}

export function ExecutionSheet({ strategy, state, plan, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [execDate, setExecDate] = useState(today)
  const [rows, setRows] = useState<Row[]>([
    { execType: 'buy_full', price: '', qty: '', note: '' },
  ])

  const mutation = useCreateExecution(strategy.id)

  function addRow() {
    setRows((r) => [...r, { execType: 'buy_full', price: '', qty: '', note: '' }])
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  async function handleSubmit() {
    const fills: FillRowInput[] = rows
      .filter((r) => r.execType !== 'no_exec' || true)
      .map((r) => ({
        execType: r.execType,
        price: parseFloat(r.price) || 0,
        qty: parseInt(r.qty) || 0,
        note: r.note || undefined,
      }))

    try {
      const result = await mutation.mutateAsync({ execDate, rows: fills })
      onClose({ cycleEnded: result.cycleEnded, profit: result.profit, profitPct: result.profitPct })
    } catch (e) {
      alert('체결 입력 실패: ' + String(e))
    }
  }

  // 자동완성: 플랜에서 첫 행 가격 채우기
  function autofill(rowIdx: number, execType: string) {
    if (!plan) return
    const match = plan.buyRows.find((r) => r.execType === execType) ?? plan.sellRows.find((r) => r.execType === execType)
    if (!match) return
    setRows((r) =>
      r.map((row, idx) =>
        idx === rowIdx
          ? { ...row, price: String(match.price.toFixed(2)), qty: String(match.qty ?? '') }
          : row,
      ),
    )
  }

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={() => onClose()}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
        }}
      />

      {/* 시트 */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '20px 16px 32px',
          zIndex: 101, maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>
            {strategy.ticker} 체결 입력
          </h3>
          <button
            onClick={() => onClose()}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* 현재 상태 요약 */}
        {state && (
          <div
            style={{
              display: 'flex', gap: 16, padding: '10px 12px',
              background: 'var(--color-bg)', borderRadius: 10, marginBottom: 16, fontSize: 13,
            }}
          >
            <div><span style={{ color: 'var(--color-text-secondary)' }}>T값 </span><strong>{fmtT(state.tValue)}</strong></div>
            <div><span style={{ color: 'var(--color-text-secondary)' }}>평단 </span><strong>{fmtUSD(state.avgPrice)}</strong></div>
            <div><span style={{ color: 'var(--color-text-secondary)' }}>보유 </span><strong>{state.quantity}주</strong></div>
          </div>
        )}

        {/* 날짜 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
            체결 날짜
          </label>
          <input
            type="date"
            value={execDate}
            onChange={(e) => setExecDate(e.target.value)}
            style={{
              width: '100%', padding: '10px', border: '1px solid var(--color-border)',
              borderRadius: 10, fontSize: 14,
            }}
          />
        </div>

        {/* 체결 행 */}
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              border: '1px solid var(--color-border)', borderRadius: 12,
              padding: 12, marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>체결 {i + 1}</span>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}
                >
                  삭제
                </button>
              )}
            </div>

            {/* 체결 유형 */}
            <select
              value={row.execType}
              onChange={(e) => {
                updateRow(i, 'execType', e.target.value)
                autofill(i, e.target.value)
              }}
              style={{
                width: '100%', padding: '8px', border: '1px solid var(--color-border)',
                borderRadius: 8, fontSize: 13, marginBottom: 8, background: '#fff',
              }}
            >
              {EXEC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            {row.execType !== 'no_exec' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>체결가 ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => updateRow(i, 'price', e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%', padding: '8px', border: '1px solid var(--color-border)',
                      borderRadius: 8, fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>수량 (주)</label>
                  <input
                    type="number"
                    step="1"
                    value={row.qty}
                    onChange={(e) => updateRow(i, 'qty', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%', padding: '8px', border: '1px solid var(--color-border)',
                      borderRadius: 8, fontSize: 13,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addRow}
          style={{
            display: 'block', width: '100%', padding: '10px',
            border: '1px dashed var(--color-border)', borderRadius: 10,
            background: '#fff', fontSize: 13, color: 'var(--color-text-secondary)',
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          + 체결 추가
        </button>

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          style={{
            display: 'block', width: '100%', padding: '14px',
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {mutation.isPending ? '저장 중...' : '체결 저장'}
        </button>
      </div>
    </>
  )
}
