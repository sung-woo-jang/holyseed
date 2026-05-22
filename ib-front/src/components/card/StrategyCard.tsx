import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useStrategyState, useTodayPlan, usePriceHistory } from '@/queries/iv.queries'
import { fmtUSD, fmtT, fmtPct, MODE_LABEL, MODE_COLOR } from '@/lib/format'
import { computeRSI } from '@/lib/rsi'
import type { IvStrategy } from '@/lib/iv-api'
import { ExecutionSheet } from '@/components/sheet/ExecutionSheet'
import { CycleEndOverlay } from '@/components/overlay/CycleEndOverlay'

function starPct(ticker: string, division: number, t: number): number {
  if (ticker === 'TQQQ') return 15 - (30 / division) * t
  return 20 - (40 / division) * t
}

function onceAmount(cash: number, division: number, t: number): number {
  const remaining = division - t
  if (remaining <= 0) return 0
  return cash / remaining
}

interface Props {
  strategy: IvStrategy
}

export function StrategyCard({ strategy }: Props) {
  const nav = useNavigate()
  const { data: state } = useStrategyState(strategy.id)
  const { data: plan } = useTodayPlan(strategy.id)
  const { data: priceHistory = [] } = usePriceHistory(strategy.ticker)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cycleEnd, setCycleEnd] = useState<{ profit: number; profitPct: number } | null>(null)

  const mode = state?.mode ?? 'cycle_start'
  const modeLabel = MODE_LABEL[mode] ?? mode
  const modeColor = MODE_COLOR[mode] ?? 'var(--color-text-secondary)'

  const t = state?.tValue ?? 0
  const avg = state?.avgPrice ?? 0
  const qty = state?.quantity ?? 0
  const cash = state?.cash ?? 0
  const closePrice = plan?.closePrice ?? state?.lastClose ?? null

  const sPct = avg > 0 ? starPct(strategy.ticker, strategy.division, t) : null
  const starPrice = avg > 0 && sPct != null ? avg * (1 + sPct / 100) : null
  const once = onceAmount(cash, strategy.division, t)

  // RSI 계산
  const currentRsi = useMemo(() => {
    const sorted = [...priceHistory].sort((a, b) => a.priceDate.localeCompare(b.priceDate))
    const closes = sorted.map((p) => p.closePrice)
    if (closes.length < 15) return null
    const rsiArr = computeRSI(closes)
    return rsiArr[rsiArr.length - 1]
  }, [priceHistory])

  // 스파크라인 데이터 (최근 20일)
  const sparkData = useMemo(() => {
    return [...priceHistory]
      .sort((a, b) => a.priceDate.localeCompare(b.priceDate))
      .slice(-20)
      .map((p) => ({ v: p.closePrice }))
  }, [priceHistory])

  const rsiColor =
    currentRsi == null ? 'var(--color-text-secondary)'
    : currentRsi >= 70 ? '#ef4444'
    : currentRsi <= 30 ? '#3182f6'
    : '#22c55e'

  return (
    <>
      <div className="card" style={{ marginBottom: 12 }}>
        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 20 }}>{strategy.ticker}</span>
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              사이클 {strategy.cycleNo} · {strategy.division}분할
            </span>
          </div>
          <span
            style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: modeColor + '22', color: modeColor, whiteSpace: 'nowrap',
            }}
          >
            {modeLabel}
          </span>
        </div>

        {/* ── 종가 + RSI pill + 스파크라인 ── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            {closePrice != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{fmtUSD(closePrice)}</span>
                {currentRsi != null && (
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: rsiColor + '20', color: rsiColor,
                    }}
                  >
                    RSI {currentRsi.toFixed(0)}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* 스파크라인 */}
          {sparkData.length >= 5 && (
            <div style={{ width: 80, height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={modeColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={modeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone" dataKey="v"
                    stroke={modeColor} strokeWidth={1.5}
                    fill={`url(#spark-${strategy.id})`}
                    dot={false} isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── 리버스 모드 배너 ── */}
        {mode === 'reverse' && (
          <div
            style={{
              padding: '8px 12px', marginBottom: 8,
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#ef4444',
            }}
          >
            리버스 모드 진행 중 · 무한매도 + 쿼터매수
          </div>
        )}

        {/* ── 큰수매수 경고 ── */}
        {plan?.largeNumberBuy && (
          <div
            style={{
              padding: '8px 12px', marginBottom: 8,
              background: '#fffbeb', border: '1px solid #fbbf24',
              borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#d97706',
            }}
          >
            큰수매수 권장: <strong>{fmtUSD(plan.largeNumberBuy.suggested)}</strong>
          </div>
        )}

        {/* ── 현재 상태 KPI ── */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            padding: '10px 0', borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)', marginBottom: 12,
          }}
        >
          {[
            { label: 'T값', value: fmtT(t) },
            { label: '평단', value: avg > 0 ? fmtUSD(avg) : '-' },
            { label: '보유수량', value: `${qty}주` },
            { label: '잔금', value: fmtUSD(cash) },
            { label: '1회매수액', value: fmtUSD(once) },
            { label: '별%', value: sPct != null ? fmtPct(sPct) : '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── 별지점 / LOC ── */}
        {starPrice != null && (
          <div
            style={{
              display: 'flex', gap: 16, marginBottom: 12,
              padding: '8px 10px', background: 'var(--color-star-bg)', borderRadius: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>별지점</div>
              <div style={{ fontWeight: 700, color: 'var(--color-star)', fontSize: 14 }}>{fmtUSD(starPrice)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>LOC 매수가</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtUSD(starPrice - 0.01)}</div>
            </div>
            {avg > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {strategy.ticker === 'TQQQ' ? '15%' : '20%'} 지정가
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-fall)' }}>
                  {fmtUSD(avg * (strategy.ticker === 'TQQQ' ? 1.15 : 1.20))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 매수점 테이블 ── */}
        {plan && plan.buyRows.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>매수점</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  <th style={{ textAlign: 'left', paddingBottom: 4 }}>구분</th>
                  <th style={{ textAlign: 'right', paddingBottom: 4 }}>가격</th>
                  <th style={{ textAlign: 'right', paddingBottom: 4 }}>수량</th>
                </tr>
              </thead>
              <tbody>
                {plan.buyRows.map((row, i) => {
                  const isStar = row.label.includes('★') || row.label.includes('별') || row.label.includes('큰수')
                  return (
                    <tr key={i} style={{ background: isStar ? 'var(--color-star-bg)' : 'transparent' }}>
                      <td style={{ padding: '4px 0', fontWeight: isStar ? 700 : 400 }}>{row.label}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-rise)', fontWeight: 600 }}>{fmtUSD(row.price)}</td>
                      <td style={{ textAlign: 'right' }}>{row.qty != null ? `${row.qty}주` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 매도점 테이블 ── */}
        {plan && plan.sellRows.filter((r) => (r.qty ?? 0) > 0).length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>매도점</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  <th style={{ textAlign: 'left', paddingBottom: 4 }}>구분</th>
                  <th style={{ textAlign: 'right', paddingBottom: 4 }}>가격</th>
                  <th style={{ textAlign: 'right', paddingBottom: 4 }}>수량</th>
                </tr>
              </thead>
              <tbody>
                {plan.sellRows.filter((r) => (r.qty ?? 0) > 0).map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 0' }}>{row.label}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-fall)', fontWeight: 600 }}>{fmtUSD(row.price)}</td>
                    <td style={{ textAlign: 'right' }}>{row.qty != null ? `${row.qty}주` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CTA 버튼 ── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              flex: 1, padding: '10px', border: '1px solid var(--color-border)',
              borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', color: 'var(--color-text)',
            }}
          >
            체결 입력
          </button>
          <button
            onClick={() => nav(`/strategy/${strategy.id}`)}
            style={{
              flex: 1, padding: '10px', border: 'none',
              borderRadius: 10, background: 'var(--color-primary)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            상세
          </button>
        </div>
      </div>

      {sheetOpen && (
        <ExecutionSheet
          strategy={strategy}
          state={state ?? null}
          plan={plan ?? null}
          onClose={(result) => {
            setSheetOpen(false)
            if (result?.cycleEnded) {
              setCycleEnd({ profit: result.profit!, profitPct: result.profitPct! })
            }
          }}
        />
      )}

      {cycleEnd && (
        <CycleEndOverlay
          strategy={strategy}
          profit={cycleEnd.profit}
          profitPct={cycleEnd.profitPct}
          onClose={() => setCycleEnd(null)}
        />
      )}
    </>
  )
}
