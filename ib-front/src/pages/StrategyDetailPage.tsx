import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line, BarChart, Bar, Cell,
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

export function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('chart')

  const { data: strategy } = useStrategy(id!)
  const { data: state } = useStrategyState(id!)
  const { data: plan } = useTodayPlan(id!)
  const { data: execs = [] } = useExecutions(id!)
  const { data: priceHistory = [] } = usePriceHistory(strategy?.ticker ?? '')

  if (!strategy || !state) {
    return <div style={{ padding: 16 }}>로딩 중...</div>
  }

  const mode = state.mode ?? 'cycle_start'

  // 차트 데이터 (오래된 것부터 정렬)
  const sortedPrices = [...priceHistory].sort((a, b) => a.priceDate.localeCompare(b.priceDate))
  const closes = sortedPrices.map((p) => p.closePrice)
  const rsiValues = computeRSI(closes)

  const chartData = sortedPrices.map((p, i) => {
    const prev = i > 0 ? sortedPrices[i - 1].closePrice : p.closePrice
    return {
      date: p.priceDate.slice(5),  // MM-DD
      close: p.closePrice,
      avg: state.avgPrice > 0 ? state.avgPrice : undefined,
      rsi: Math.round((rsiValues[i] ?? 50) * 10) / 10,
      change: ((p.closePrice - prev) / prev) * 100,
    }
  })

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px',
          background: '#fff', borderBottom: '1px solid var(--color-border)',
          position: 'sticky', top: 0, zIndex: 10,
        }}
      >
        <button
          onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0 }}
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
          background: '#fff', borderBottom: '1px solid var(--color-border)',
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
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 10 }}>
              현재 상태
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'T값', value: fmtT(state.tValue) },
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

          {/* 종가 차트 */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
                종가 추이 (최근 {chartData.length}거래일)
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3182f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3182f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 5)} />
                  <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toFixed(2)}`, '종가']}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  {state.avgPrice > 0 && (
                    <ReferenceLine y={state.avgPrice} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: '평단', fill: '#f59e0b', fontSize: 10 }} />
                  )}
                  <Area type="monotone" dataKey="close" stroke="#3182f6" strokeWidth={2} fill="url(#colorClose)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* RSI 차트 */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
                RSI14
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 5)} />
                  <YAxis tick={{ fontSize: 10 }} width={30} domain={[0, 100]} ticks={[30, 50, 70]} />
                  <Tooltip formatter={(v: number) => [v.toFixed(1), 'RSI']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <ReferenceLine y={70} stroke="#f04452" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="#3182f6" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 일변동 차트 */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
                일변동 (%)
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={chartData.slice(-20)} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} width={30} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, '변동']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="change" radius={[2, 2, 0, 0]}>
                    {chartData.slice(-20).map((entry, i) => (
                      <Cell key={i} fill={entry.change >= 0 ? '#f04452' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {execs.map((e) => {
              const isBuy = e.execType.startsWith('buy')
              const stateAfter = e.stateAfter as Record<string, unknown>
              return (
                <div
                  key={e.id}
                  className="card"
                  style={{ padding: '12px 16px', marginBottom: 4 }}
                >
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
                const color = MODE_COLOR[step]
                return (
                  <div key={step} style={{ display: 'flex', gap: 12, paddingBottom: i < MODE_STEPS.length - 1 ? 16 : 0 }}>
                    {/* 타임라인 선 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                      <div
                        style={{
                          width: 16, height: 16, borderRadius: 8,
                          background: isActive ? color : 'var(--color-border)',
                          border: `2px solid ${isActive ? color : 'var(--color-border)'}`,
                          flexShrink: 0,
                        }}
                      />
                      {i < MODE_STEPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 20 }} />
                      )}
                    </div>
                    {/* 내용 */}
                    <div style={{ paddingBottom: 4 }}>
                      <div
                        style={{
                          fontWeight: isActive ? 700 : 500, fontSize: 14,
                          color: isActive ? color : 'var(--color-text)',
                        }}
                      >
                        {MODE_STEP_LABEL[step]}
                        {isActive && (
                          <span
                            style={{
                              marginLeft: 8, fontSize: 10, padding: '2px 6px',
                              background: color + '22', color: color, borderRadius: 10,
                            }}
                          >
                            현재
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {MODE_STEP_DESC[step]}
                      </div>
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
                  padding: '8px 0', borderBottom: '1px solid var(--color-border)',
                  fontSize: 13,
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
