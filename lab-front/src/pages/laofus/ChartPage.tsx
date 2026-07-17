import { useEffect, useMemo, useState } from 'react'
import { computeIndicators } from '@holyseed/laofus-core'
import type { CandleDto, TradeDto } from '@/features/laofus/lib/types'
import { api, n, usd, kstDateOnly } from '@/features/laofus/lib/types'
import { useStatus, usePrice } from '@/features/laofus/lib/useStatus'

type Range = '1m' | '3m' | 'all' | 'intraday'

export default function ChartPage() {
  const { status } = useStatus()
  const price = usePrice()
  const [range, setRange] = useState<Range>('3m')
  const [candles, setCandles] = useState<CandleDto[] | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    setCandles(null)
    api<{ candles: CandleDto[] }>(`/api/laofus/candles?range=${range}`)
      .then((d) => setCandles(d.candles.slice().reverse())) // API는 최신순 → 시간순으로
      .catch(() => setCandles([]))
  }, [range])

  const s = status?.state
  const levels = useMemo(() => {
    if (!s) return null
    const st = {
      cycle: s.cycleNo,
      T: n(s.t),
      quantity: n(s.quantity),
      avgPrice: n(s.avgPrice),
      cash: n(s.cash),
      principal: n(s.principal),
    }
    const ind = computeIndicators(st)
    return { avg: st.avgPrice, star: ind.starPrice, fullSell: ind.fullSellPrice, firstHalf: st.T < 20 }
  }, [s])

  // 거래 마커: 날짜(YYYY-MM-DD) → trade
  const tradesByDate = useMemo(() => {
    const map = new Map<string, TradeDto[]>()
    for (const c of status?.cycles ?? []) {
      for (const t of c.trades) {
        if (t.kind === '이월') continue
        const key = t.date.slice(0, 10)
        map.set(key, [...(map.get(key) ?? []), t])
      }
    }
    return map
  }, [status])

  if (!candles || !status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )
  if (candles.length === 0)
    return (
      <main className="wrap">
        <p>캔들 데이터 없음</p>
      </main>
    )

  const W = 960
  const H = 380
  const PAD = { l: 8, r: 64, t: 12, b: 26 }
  const vals = candles.flatMap((c) => [n(c.highPrice), n(c.lowPrice)])
  if (levels) vals.push(levels.avg, levels.star, levels.fullSell)
  const yMin = Math.min(...vals) * 0.99
  const yMax = Math.max(...vals) * 1.01
  const ys = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
  const bw = (W - PAD.l - PAD.r) / candles.length
  const xs = (i: number) => PAD.l + i * bw + bw / 2

  const ticks: number[] = []
  const step = Math.max(10, Math.round((yMax - yMin) / 6 / 10) * 10)
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v)

  const hv = hover !== null ? candles[hover] : null
  const levelLines = levels
    ? [
        { v: levels.avg, label: `평단 ${usd(levels.avg)}`, color: 'var(--series-2)' },
        { v: levels.star, label: `별지점 ${usd(levels.star)}`, color: 'var(--series-1)' },
        { v: levels.fullSell, label: `+20% ${usd(levels.fullSell)}`, color: 'var(--status-critical)' },
      ]
    : []

  return (
    <main className="wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, marginRight: 'auto' }}>
          SOXL {range === 'intraday' ? '분봉 (최근 거래일)' : '일봉'}
        </h1>
        {(['1m', '3m', 'all', 'intraday'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              fontWeight: range === r ? 700 : 400,
              borderColor: range === r ? 'var(--series-1)' : 'var(--border)',
            }}
          >
            {r === '1m' ? '1개월' : r === '3m' ? '3개월' : r === 'all' ? '전체' : '인트라데이'}
          </button>
        ))}
      </div>

      <div className="card" style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', minWidth: 640, display: 'block' }}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - rect.left) / rect.width) * W
              const i = Math.floor((x - PAD.l) / bw)
              setHover(Math.max(0, Math.min(candles.length - 1, i)))
            }}
          >
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid)" strokeWidth="1" />
                <text x={W - PAD.r + 6} y={ys(v) + 4} fontSize="10" fill="var(--text-muted)">
                  {v}
                </text>
              </g>
            ))}
            {candles.map((c, i) =>
              i % Math.ceil(candles.length / 8) === 0 ? (
                <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                  {range === 'intraday'
                    ? new Date(c.timestamp).toLocaleTimeString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : kstDateOnly(c.timestamp)}
                </text>
              ) : null
            )}
            {/* 캔들 */}
            {candles.map((c, i) => {
              const o = n(c.openPrice)
              const cl = n(c.closePrice)
              const up = cl >= o
              const color = up ? 'var(--delta-good)' : 'var(--status-critical)'
              const bodyW = Math.max(2, bw * 0.6)
              return (
                <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
                  <line
                    x1={xs(i)}
                    x2={xs(i)}
                    y1={ys(n(c.highPrice))}
                    y2={ys(n(c.lowPrice))}
                    stroke={color}
                    strokeWidth="1"
                  />
                  <rect
                    x={xs(i) - bodyW / 2}
                    y={ys(Math.max(o, cl))}
                    width={bodyW}
                    height={Math.max(1, Math.abs(ys(o) - ys(cl)))}
                    fill={color}
                    rx="1"
                  />
                </g>
              )
            })}
            {/* 거래 마커 */}
            {range !== 'intraday' &&
              candles.map((c, i) => {
                const key = new Date(c.timestamp).toISOString().slice(0, 10)
                const ts = tradesByDate.get(key)
                if (!ts) return null
                const sell = ts.some((t) => t.side === 'SELL')
                return (
                  <circle
                    key={`m${i}`}
                    cx={xs(i)}
                    cy={H - PAD.b - 8}
                    r="4"
                    fill={sell ? 'var(--status-critical)' : 'var(--series-1)'}
                    stroke="var(--surface-1)"
                    strokeWidth="2"
                  >
                    <title>{ts.map((t) => `${t.seq}차 ${t.kind} ${usd(n(t.amount))}`).join(', ')}</title>
                  </circle>
                )
              })}
            {/* 무매 레벨 수평선 */}
            {levelLines.map((l) => (
              <g key={l.label}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={ys(l.v)}
                  y2={ys(l.v)}
                  stroke={l.color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.8"
                />
                <text x={PAD.l + 4} y={ys(l.v) - 4} fontSize="11" fill="var(--text-secondary)">
                  {l.label}
                </text>
              </g>
            ))}
            {/* 현재가 */}
            {price && (
              <g>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={ys(price.price)}
                  y2={ys(price.price)}
                  stroke="var(--text-primary)"
                  strokeWidth="1"
                  opacity="0.6"
                />
                <text
                  x={W - PAD.r + 6}
                  y={ys(price.price) + 4}
                  fontSize="10"
                  fontWeight="700"
                  fill="var(--text-primary)"
                >
                  {price.price.toFixed(2)}
                </text>
              </g>
            )}
          </svg>
        </div>
        {hv && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 24,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ color: 'var(--text-muted)' }}>
              {range === 'intraday'
                ? new Date(hv.timestamp).toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : kstDateOnly(hv.timestamp)}
            </div>
            <div>
              시 {usd(n(hv.openPrice))} · 고 {usd(n(hv.highPrice))} · 저 {usd(n(hv.lowPrice))} · 종{' '}
              <strong>{usd(n(hv.closePrice))}</strong>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>거래량 {Number(hv.volume).toLocaleString()}</div>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 3,
                background: 'var(--series-2)',
                borderRadius: 2,
                verticalAlign: 'middle',
                marginRight: 4,
              }}
            />
            평단
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 3,
                background: 'var(--series-1)',
                borderRadius: 2,
                verticalAlign: 'middle',
                marginRight: 4,
              }}
            />
            별지점
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 3,
                background: 'var(--status-critical)',
                borderRadius: 2,
                verticalAlign: 'middle',
                marginRight: 4,
              }}
            />
            전량매도가
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 4,
                background: 'var(--series-1)',
                verticalAlign: 'middle',
                marginRight: 4,
              }}
            />
            매수일
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 4,
                background: 'var(--status-critical)',
                verticalAlign: 'middle',
                marginRight: 4,
              }}
            />
            매도일
          </span>
        </div>
      </div>
    </main>
  )
}
