import { useState, useMemo } from 'react'
import { useCreateExecution } from '@/queries/iv.queries'
import { fmtUSD, fmtT, MODE_LABEL, MODE_COLOR } from '@/lib/format'
import { computePreview } from '@/lib/calculator'
import type { IvStrategy, IvState, DailyPlan, FillRowInput } from '@/lib/iv-api'

const EXEC_TYPES: { value: string; label: string }[] = [
  { value: 'buy_full', label: '1회 매수' },
  { value: 'buy_half_star', label: '별LOC 매수 (1/2)' },
  { value: 'buy_half_avg', label: '평단LOC 매수 (1/2)' },
  { value: 'sell_quarter', label: '쿼터 매도' },
  { value: 'sell_fixed', label: '지정가 매도' },
  { value: 'sell_moc', label: 'MOC 매도' },
  { value: 'no_exec', label: '미체결' },
]

const T_DELTA: Record<string, string> = {
  buy_full: 'T +1.0',
  buy_half_star: 'T +0.5',
  buy_half_avg: 'T +0.5',
  sell_quarter: 'T ×0.75',
  sell_fixed: 'T ×0.25 (다음 매수 후 확정)',
  sell_moc: 'T ×0.95',
  no_exec: '변화 없음',
}

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
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)

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

  // 실시간 미리보기
  const preview = useMemo(() => {
    if (!state) return null
    const fills = rows
      .filter((r) => r.execType !== 'no_exec')
      .map((r) => ({
        execType: r.execType,
        price: parseFloat(r.price) || 0,
        qty: parseInt(r.qty) || 0,
      }))
      .filter((f) => f.price > 0 || f.execType === 'no_exec')
    if (fills.length === 0) return null
    return computePreview(
      { ...state, division: strategy.division },
      fills,
    )
  }, [rows, state, strategy.division])

  async function handleSubmit() {
    const fills: FillRowInput[] = rows.map((r) => ({
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

  function autofill(rowIdx: number, execType: string) {
    if (!plan) return
    const match =
      plan.buyRows.find((r) => r.execType === execType) ??
      plan.sellRows.find((r) => r.execType === execType)
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
      <div onClick={() => onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} />

      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '20px 16px 32px',
          zIndex: 101, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{strategy.ticker} 체결 입력</h3>
          <button onClick={() => onClose()} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        {/* 현재 → 예상 결과 비교 */}
        {state && (
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr',
              gap: 8, padding: '12px', borderRadius: 12,
              background: 'var(--color-bg)', marginBottom: 16, fontSize: 12,
              alignItems: 'center',
            }}
          >
            {/* 현재 상태 */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)', fontSize: 11 }}>현재</div>
              {[
                { label: 'T값', value: fmtT(state.tValue) },
                { label: '평단', value: fmtUSD(state.avgPrice) },
                { label: '보유', value: `${state.quantity}주` },
                { label: '잔금', value: fmtUSD(state.cash) },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 3 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label} </span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {/* 화살표 */}
            <div style={{ fontSize: 16, color: 'var(--color-text-secondary)', textAlign: 'center' }}>→</div>

            {/* 예상 결과 */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6, color: preview ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: 11 }}>
                {preview ? '예상' : '예상 (입력 후 표시)'}
              </div>
              {preview ? (
                <>
                  {[
                    { label: 'T값', value: fmtT(preview.tValue), changed: preview.tValue !== state.tValue },
                    { label: '평단', value: fmtUSD(preview.avgPrice), changed: Math.abs(preview.avgPrice - state.avgPrice) > 0.001 },
                    { label: '보유', value: `${preview.quantity}주`, changed: preview.quantity !== state.quantity },
                    { label: '잔금', value: fmtUSD(preview.cash), changed: Math.abs(preview.cash - state.cash) > 0.001 },
                  ].map(({ label, value, changed }) => (
                    <div key={label} style={{ marginBottom: 3 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{label} </span>
                      <strong style={{ color: changed ? 'var(--color-primary)' : 'inherit' }}>{value}</strong>
                    </div>
                  ))}
                  <div style={{ marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 10,
                        background: MODE_COLOR[preview.mode] + '22',
                        color: MODE_COLOR[preview.mode], fontWeight: 700,
                      }}
                    >
                      {MODE_LABEL[preview.mode] ?? preview.mode}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>—</div>
              )}
            </div>
          </div>
        )}

        {/* 날짜 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>체결 날짜</label>
          <input
            type="date" value={execDate}
            onChange={(e) => setExecDate(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 14 }}
          />
        </div>

        {/* 체결 행 */}
        {rows.map((row, i) => (
          <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>체결 {i + 1}</span>
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>삭제</button>
              )}
            </div>

            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)',
                  borderRadius: 8, fontSize: 16, background: '#fff', textAlign: 'left',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  color: 'var(--color-text)',
                }}
              >
                <span>{EXEC_TYPES.find((t) => t.value === row.execType)?.label}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>▼</span>
              </button>
              {openDropdown === i && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)' }}
                    onClick={() => setOpenDropdown(null)}
                  />
                  <div style={{
                    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: 480, zIndex: 301,
                    background: '#fff', borderRadius: '16px 16px 0 0',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                  }}>
                    <div style={{
                      padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
                      fontWeight: 700, fontSize: 15, textAlign: 'center',
                    }}>
                      체결 유형 선택
                    </div>
                    {EXEC_TYPES.map((t, optIdx) => (
                      <button
                        key={t.value}
                        onClick={() => {
                          updateRow(i, 'execType', t.value)
                          autofill(i, t.value)
                          setOpenDropdown(null)
                        }}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          width: '100%', padding: '16px 20px',
                          background: 'none', border: 'none',
                          borderBottom: optIdx < EXEC_TYPES.length - 1 ? '1px solid var(--color-border)' : 'none',
                          textAlign: 'left', fontSize: 17,
                          color: row.execType === t.value ? 'var(--color-primary)' : 'var(--color-text)',
                          cursor: 'pointer', fontWeight: row.execType === t.value ? 700 : 400,
                        }}
                      >
                        <span>{t.label}</span>
                        {row.execType === t.value && <span style={{ fontSize: 18 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {row.execType !== 'no_exec' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>체결가 ($)</label>
                  <input
                    type="number" step="0.01" value={row.price}
                    onChange={(e) => updateRow(i, 'price', e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>수량 (주)</label>
                  <input
                    type="number" step="1" value={row.qty}
                    onChange={(e) => updateRow(i, 'qty', e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>
            )}
            {/* T 변화 + 체결금액 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 8,
                background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                {T_DELTA[row.execType] ?? ''}
              </span>
              {row.price && row.qty && row.execType !== 'no_exec' && (
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  ≈ {fmtUSD(parseFloat(row.price) * parseInt(row.qty))}
                </span>
              )}
            </div>
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
