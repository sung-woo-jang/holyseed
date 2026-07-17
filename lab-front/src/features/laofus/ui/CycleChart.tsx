import { useState } from 'react'
import type { TradeDto } from '@/features/laofus/lib/types'
import { n, usd, kstDateOnly } from '@/features/laofus/lib/types'

/** 사이클 내 체결가 vs 평단 라인차트 (2시리즈, hover 툴팁) */
export function CycleChart({ trades }: { trades: TradeDto[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const pts = trades.filter((t) => t.kind !== '이월')
  if (pts.length < 2) return null

  const W = 720
  const H = 240
  const PAD = { l: 48, r: 76, t: 16, b: 28 }
  const xs = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r)
  const prices = pts.flatMap((t) => [n(t.price), n(t.avgAfter)])
  const yMin = Math.floor(Math.min(...prices) / 20) * 20
  const yMax = Math.ceil(Math.max(...prices) / 20) * 20
  const ys = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b)
  const path = (get: (t: TradeDto) => number) =>
    pts.map((t, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(get(t)).toFixed(1)}`).join(' ')
  const ticks: number[] = []
  for (let v = yMin; v <= yMax; v += Math.max(20, Math.round((yMax - yMin) / 4 / 20) * 20)) ticks.push(v)
  const last = pts[pts.length - 1]
  const hv = hover !== null ? pts[hover] : null

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 3,
              background: 'var(--series-1)',
              borderRadius: 2,
              verticalAlign: 'middle',
              marginRight: 5,
            }}
          />
          체결가
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 3,
              background: 'var(--series-2)',
              borderRadius: 2,
              verticalAlign: 'middle',
              marginRight: 5,
            }}
          />
          평단
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', minWidth: 480, display: 'block' }}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * W
            const i = Math.round(((x - PAD.l) / (W - PAD.l - PAD.r)) * (pts.length - 1))
            setHover(Math.max(0, Math.min(pts.length - 1, i)))
          }}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid)" strokeWidth="1" />
              <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                {v}
              </text>
            </g>
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--baseline)" strokeWidth="1" />
          {pts.map((t, i) =>
            i % Math.ceil(pts.length / 8) === 0 || i === pts.length - 1 ? (
              <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                {kstDateOnly(t.date)}
              </text>
            ) : null
          )}
          {hv && (
            <line
              x1={xs(hover as number)}
              x2={xs(hover as number)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="var(--baseline)"
              strokeWidth="1"
            />
          )}
          <path
            d={path((t) => n(t.avgAfter))}
            fill="none"
            stroke="var(--series-2)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={path((t) => n(t.price))}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {pts.map((t, i) => (
            <g key={i}>
              <circle
                cx={xs(i)}
                cy={ys(n(t.price))}
                r={hover === i ? 5 : 4}
                fill="var(--series-1)"
                stroke="var(--surface-1)"
                strokeWidth="2"
              />
              <circle
                cx={xs(i)}
                cy={ys(n(t.avgAfter))}
                r={hover === i ? 5 : 4}
                fill="var(--series-2)"
                stroke="var(--surface-1)"
                strokeWidth="2"
              />
            </g>
          ))}
          <text x={xs(pts.length - 1) + 8} y={ys(n(last.price)) + 4} fontSize="11" fill="var(--text-secondary)">
            {usd(n(last.price))}
          </text>
          <text x={xs(pts.length - 1) + 8} y={ys(n(last.avgAfter)) + 16} fontSize="11" fill="var(--text-secondary)">
            {usd(n(last.avgAfter))}
          </text>
        </svg>
      </div>
      {hv && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 60,
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
            {hv.seq}차 · {kstDateOnly(hv.date)} · {hv.kind}
          </div>
          <div>
            체결가 {usd(n(hv.price))} · 평단 {usd(n(hv.avgAfter))}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            T {n(hv.tBefore)} → {n(hv.tAfter)} · 잔금 {usd(n(hv.cashAfter))}
          </div>
        </div>
      )}
    </div>
  )
}
