import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line,
} from 'recharts'
import { useStrategy, useStrategyState, useTodayPlan, useExecutions, usePriceHistory } from '@/queries/iv.queries'
import { fmtUSD, fmtT, fmtDate, MODE_LABEL, MODE_FULL, MODE_COLOR } from '@/lib/format'
import { computeRSI } from '@/lib/rsi'

type Tab = 'chart' | 'history' | 'mode'

const EXEC_LABEL: Record<string, string> = {
  buy_full: '1회 매수',
  buy_half_star: '별LOC 매수',
  buy_half_avg: '평단LOC 매수',
  sell_quarter: '쿼터매도',
  sell_fixed: '지정가매도',
  sell_moc: 'MOC 매도',
  no_exec: '미체결',
}

const MODE_STEPS = ['cycle_start', 'first_half', 'second_half', 'reverse'] as const
const MODE_STEP_LABEL: Record<string, string> = {
  cycle_start: '사이클 시작',
  first_half: '전반전',
  second_half: '후반전',
  reverse: '리버스',
}
const MODE_STEP_DESC: Record<string, string> = {
  cycle_start: 'T=0, 큰수 LOC 매수',
  first_half: '0 < T < 분할/2, 별LOC + 평단LOC',
  second_half: 'T ≥ 분할/2, 전체 별LOC',
  reverse: 'T > 분할-1, 무한매도 + 쿼터매수',
}

function starPctFn(ticker: string, division: number, t: number): number {
  if (ticker === 'TQQQ') return 15 - (30 / division) * t
  return 20 - (40 / division) * t
}

export function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('chart')
  const [period, setPeriod] = useState<5 | 65 | 252 | 756 | 1260>(65)

  const { data: strategy } = useStrategy(id!)
  const { data: state } = useStrategyState(id!)
  const { data: plan } = useTodayPlan(id!)
  const { data: execs = [] } = useExecutions(id!)
  const { data: priceHistory = [] } = usePriceHistory(strategy?.ticker ?? '')

  // ─── 모든 useMemo는 early return 전에 선언 (Rules of Hooks) ───
  const chartData = useMemo(() => {
    const sorted = [...priceHistory].sort((a, b) => a.priceDate.localeCompare(b.priceDate))
    const closes = sorted.map((p) => p.closePrice)
    const rsiValues = computeRSI(closes)
    const sortedExecs = [...execs].sort((a, b) => a.execDate.localeCompare(b.execDate))
    const avgByDate: Record<string, number> = {}
    for (const e of sortedExecs) {
      const avg = (e.stateAfter as Record<string, unknown>).avgPrice as number
      if (avg > 0) avgByDate[e.execDate] = avg
    }
    let carryAvg = 0
    return sorted.map((p, i) => {
      const prev = i > 0 ? sorted[i - 1].closePrice : p.closePrice
      if (avgByDate[p.priceDate] !== undefined) carryAvg = avgByDate[p.priceDate]
      return {
        date: p.priceDate.slice(5),
        close: p.closePrice,
        high: p.highPrice,
        avg: carryAvg > 0 ? carryAvg : undefined,
        rsi: Math.round((rsiValues[i] ?? 50) * 10) / 10,
        change: ((p.closePrice - prev) / prev) * 100,
      }
    })
  }, [priceHistory, execs])

  const tChartData = useMemo(() => {
    return [...execs]
      .sort((a, b) => a.execDate.localeCompare(b.execDate))
      .map((e) => ({
        date: e.execDate.slice(5),
        t: Number((e.stateAfter as Record<string, unknown>).tValue ?? 0),
      }))
  }, [execs])

  const modeFirstDate = useMemo(() => {
    const result: Record<string, string> = {}
    const sorted = [...execs].sort((a, b) => a.execDate.localeCompare(b.execDate))
    for (const e of sorted) {
      const afterMode = (e.stateAfter as Record<string, unknown>).mode as string
      if (afterMode && !result[afterMode]) result[afterMode] = e.execDate
    }
    return result
  }, [execs])

  if (!strategy || !state) {
    return <div style={{ padding: 16 }}>로딩 중...</div>
  }

  const mode = state.mode ?? 'cycle_start'
  const visibleData = chartData.slice(-period)

  // 최신 RSI
  const currentRsi = chartData.length > 0 ? chartData[chartData.length - 1].rsi : null
  const rsiColor =
    currentRsi == null ? 'var(--color-text-secondary)'
    : currentRsi >= 70 ? '#ef4444'
    : currentRsi <= 30 ? '#3182f6'
    : '#22c55e'

  // 핵심 지표 계산
  const sPct = state.avgPrice > 0 ? starPctFn(strategy.ticker, strategy.division, state.tValue) : null
  const starPrice = sPct != null && state.avgPrice > 0 ? state.avgPrice * (1 + sPct / 100) : null

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px',
          background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)',
          position: 'sticky', top: 0, zIndex: 10,
        }}
      >
        <button
          onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0, color: 'var(--color-text)' }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>{strategy.ticker}</span>
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            사이클 {strategy.cycleNo} · {MODE_FULL[mode] ?? mode}
          </span>
        </div>
        <span
          style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: MODE_COLOR[mode] + '22', color: MODE_COLOR[mode],
          }}
        >
          {MODE_LABEL[mode] ?? mode}
        </span>
      </div>

      {/* 탭 */}
      <div
        style={{
          display: 'flex', padding: '0 16px',
          background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)',
        }}
      >
        {([['chart', '차트'], ['history', '히스토리'], ['mode', '모드 흐름']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none',
              borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: tab === key ? 700 : 400, fontSize: 14, cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 차트 탭 ── */}
      {tab === 'chart' && (
        <div style={{ padding: 16 }}>
          {/* 현재 상태 KPI */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 10 }}>현재 상태</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'T값', value: `${fmtT(state.tValue)} / ${strategy.division}` },
                { label: '평단', value: fmtUSD(state.avgPrice) },
                { label: '보유수량', value: `${state.quantity}주` },
                { label: '잔금', value: fmtUSD(state.cash) },
                { label: '종가', value: fmtUSD(state.lastClose) },
                {
                  label: '평가손익',
                  value: state.avgPrice > 0 && state.lastClose > 0
                    ? `${(((state.lastClose - state.avgPrice) / state.avgPrice) * 100).toFixed(1)}%`
                    : '-',
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 기간 셀렉터 + 종가 + 평단 이중선 차트 */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              {/* 헤더: 레전드 + 기간 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 2, background: '#f59e0b', display: 'inline-block' }} />
                    종가
                  </span>
                  {visibleData.some((d) => d.avg != null) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 12, height: 2, background: '#06b6d4', display: 'inline-block', borderTop: '2px dashed #06b6d4' }} />
                      평단
                    </span>
                  )}
                </div>
                {/* 기간 버튼 */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {([5, 65, 252, 756, 1260] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      style={{
                        padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${period === p ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: period === p ? 'var(--color-primary)' : 'var(--color-card)',
                        color: period === p ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >
                      {p === 5 ? '1주' : p === 65 ? '3달' : p === 252 ? '1년' : p === 756 ? '3년' : '5년'}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={visibleData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(visibleData.length / 4)} />
                  <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`$${v.toFixed(2)}`, name === 'close' ? '종가' : '평단']}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="close" stroke="#f59e0b" strokeWidth={2} fill="url(#colorClose)" dot={false} />
                  <Line
                    type="monotone" dataKey="avg" stroke="#06b6d4" strokeWidth={1.5}
                    strokeDasharray="4 2" dot={false} connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* RSI 패널 */}
          {chartData.length > 0 && currentRsi != null && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 26, fontWeight: 800, color: rsiColor }}>{currentRsi.toFixed(0)}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 8 }}>RSI14</span>
                </div>
                <span
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                    background: rsiColor + '20', color: rsiColor,
                  }}
                >
                  {currentRsi >= 70 ? '과매수' : currentRsi <= 30 ? '과매도' : '중립'}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={visibleData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(visibleData.length / 4)} />
                  <YAxis tick={{ fontSize: 10 }} width={30} domain={[0, 100]} ticks={[30, 50, 70]} />
                  <Tooltip formatter={(v: number) => [v.toFixed(1), 'RSI']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine y={70} stroke="#f04452" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#3182f6" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rsi" stroke={rsiColor} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
                RSI 70 이상 과매수 → 쿼터매도 주시 · RSI 30 이하 과매도 → 매수 적극 고려
              </div>
            </div>
          )}

          {/* 일변동 — 최근 2주 그리드 카드 */}
          {chartData.length > 0 && (() => {
            const twoWeeks = [...chartData].slice(-10).reverse()
            const avg5 = twoWeeks.slice(0, 5).reduce((s, d) => s + d.close, 0) / Math.min(5, twoWeeks.length)
            return (
              <div className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{strategy.ticker} 최근 종가</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    5일 평균 <strong style={{ color: 'var(--color-text)' }}>${avg5.toFixed(2)}</strong>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {twoWeeks.map((d, i) => {
                    const isUp = d.change >= 0
                    return (
                      <div
                        key={i}
                        style={{
                          background: 'var(--color-bg)', borderRadius: 10,
                          padding: '8px 6px', textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{d.date}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>${d.close.toFixed(2)}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? '#f04452' : '#2563eb' }}>
                          {isUp ? '+' : ''}{d.change.toFixed(1)}%
                        </div>
                        {d.high != null && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            H ${d.high.toFixed(2)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* T값 추이 */}
          {tChartData.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>T값 추이</div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={tChartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fontSize: 10 }} width={30}
                    domain={[0, strategy.division]}
                    ticks={[0, Math.floor(strategy.division / 2), strategy.division - 1, strategy.division]}
                  />
                  <Tooltip formatter={(v: number) => [v.toFixed(2), 'T값']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine
                    y={strategy.division / 2} stroke="#22c55e" strokeDasharray="4 2"
                    label={{ value: '전→후', position: 'insideTopLeft', fontSize: 9, fill: '#22c55e' }}
                  />
                  <ReferenceLine
                    y={strategy.division - 1} stroke="#f97316" strokeDasharray="4 2"
                    label={{ value: '리버스', position: 'insideTopLeft', fontSize: 9, fill: '#f97316' }}
                  />
                  <Line
                    type="stepAfter" dataKey="t" stroke="#3182f6" strokeWidth={2}
                    dot={{ r: 3, fill: '#3182f6' }} isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* KeyMetricsCard — 핵심 지표 */}
          {(sPct != null || currentRsi != null) && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 10 }}>
                오늘 핵심 지표
              </div>
              {[
                { label: '별%', value: sPct != null ? `${sPct.toFixed(3)}%` : '-', color: '#f59e0b' },
                { label: '별지점', value: starPrice != null ? fmtUSD(starPrice) : '-', color: '#f59e0b' },
                { label: 'LOC 매수', value: starPrice != null ? fmtUSD(starPrice - 0.01) : '-', color: undefined },
                { label: 'LOC 매도', value: starPrice != null ? fmtUSD(starPrice) : '-', color: undefined },
                { label: 'RSI14', value: currentRsi != null ? currentRsi.toFixed(0) : '-', color: rsiColor },
              ].map(({ label, value, color }, i, arr) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: color ?? 'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 오늘 계획 */}
          {plan && (
            <div className="card">
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 10 }}>
                오늘 계획 · {plan.planDate}
              </div>
              {plan.buyRows.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>매수점</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
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
                </>
              )}
              {plan.sellRows.filter((r) => (r.qty ?? 0) > 0).length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>매도점</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
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
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 히스토리 탭 ── */}
      {tab === 'history' && (
        <div style={{ padding: 16 }}>
          {execs.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 40 }}>
              체결 내역이 없습니다.
            </p>
          )}
          {execs.map((e) => {
            const isBuy = e.execType.startsWith('buy')
            const stateAfter = e.stateAfter as Record<string, unknown>
            return (
              <div key={e.id} className="card" style={{ padding: '12px 16px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{EXEC_LABEL[e.execType] ?? e.execType}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {fmtDate(e.execDate)} · {e.execQty}주 @ {fmtUSD(e.execPrice)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: isBuy ? 'var(--color-rise)' : 'var(--color-fall)' }}>
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
      )}

      {/* ── 모드 흐름 탭 ── */}
      {tab === 'mode' && (
        <div style={{ padding: 16 }}>
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 12 }}>
              현재 모드: {MODE_FULL[mode] ?? mode}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {MODE_STEPS.map((step, i) => {
                const isActive = step === mode
                const isPast = MODE_STEPS.indexOf(step) < MODE_STEPS.indexOf(mode as typeof MODE_STEPS[number])
                const color = MODE_COLOR[step]

                // 날짜 결정
                let dateLabel = ''
                if (step === 'cycle_start') {
                  const d = modeFirstDate['cycle_start'] ?? strategy.createdAt?.slice(0, 10)
                  dateLabel = d ? d : ''
                } else if (modeFirstDate[step]) {
                  dateLabel = modeFirstDate[step]
                } else if (!isPast && !isActive) {
                  dateLabel = `예정: T ≥ ${step === 'first_half' ? 1 : step === 'second_half' ? strategy.division / 2 : strategy.division - 1}`
                }

                return (
                  <div key={step} style={{ display: 'flex', gap: 12, paddingBottom: i < MODE_STEPS.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                      <div
                        style={{
                          width: 16, height: 16, borderRadius: 8, flexShrink: 0,
                          background: (isActive || isPast) ? color : 'var(--color-border)',
                          border: `2px solid ${(isActive || isPast) ? color : 'var(--color-border)'}`,
                        }}
                      />
                      {i < MODE_STEPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 20 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 4 }}>
                      <div
                        style={{
                          fontWeight: isActive ? 700 : 500, fontSize: 14,
                          color: isActive ? color : isPast ? 'var(--color-text-secondary)' : 'var(--color-text)',
                        }}
                      >
                        {MODE_STEP_LABEL[step]}
                        {isActive && (
                          <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', background: color + '22', color, borderRadius: 10 }}>
                            현재
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {MODE_STEP_DESC[step]}
                      </div>
                      {dateLabel && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          {dateLabel}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* T값 전환 조건 */}
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 10 }}>
              T값 전환 조건 ({strategy.division}분할)
            </div>
            {[
              { label: '1회 매수 (buy_full)', rule: 'T += 1' },
              { label: '절반 매수 (buy_half)', rule: 'T += 0.5' },
              { label: '쿼터 매도 (sell_quarter)', rule: 'T × 0.75' },
              { label: '지정가 매도 → LOC 매수', rule: 'T × 0.25 + 1 (or +0.5)' },
              { label: '전반전 → 후반전', rule: `T ≥ ${strategy.division / 2}` },
              { label: '후반전 → 리버스', rule: `T ≥ ${strategy.division - 1}` },
            ].map(({ label, rule }) => (
              <div
                key={label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
