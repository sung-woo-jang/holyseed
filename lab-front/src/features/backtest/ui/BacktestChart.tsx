import { useState } from 'react'

export interface BacktestChartPoint {
  date: string
  strategyValue: number
  buyHoldValue: number
}

interface BacktestChartProps {
  points: BacktestChartPoint[]
  /** 표시할 폭(px) — 부모가 컨테이너 실측폭을 계산해 전달 */
  width: number
}

const usd = (n: number) =>
  `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

/** 백테스트 자산가치 곡선(전략 vs Buy&Hold) — 수천 포인트도 단일 path로 그려 가볍게 렌더 */
export function BacktestChart({ points, width }: BacktestChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return null

  const W = Math.max(280, width)
  const H = 320
  const PAD = { l: 60, r: 16, t: 16, b: 28 }
  const xs = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const values = points.flatMap((p) => [p.strategyValue, p.buyHoldValue])
  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const ys = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b)

  const path = (get: (p: BacktestChartPoint) => number) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(get(p)).toFixed(1)}`).join(' ')

  const ticks = 5
  const yTicks: number[] = []
  for (let i = 0; i <= ticks; i++) yTicks.push(yMin + ((yMax - yMin) * i) / ticks)

  const hv = hover !== null ? points[hover] : null

  return (
    <div style={{ position: 'relative' }}>
      <div className="mb-1 flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="mr-1.5 inline-block h-[3px] w-3 rounded-sm align-middle" style={{ background: '#5487c3' }} />
          섀넌의 도깨비
        </span>
        <span>
          <span className="mr-1.5 inline-block h-[3px] w-3 rounded-sm align-middle" style={{ background: '#a97a34' }} />
          Buy&amp;Hold
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ display: 'block' }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * W
          const i = Math.round(((x - PAD.l) / (W - PAD.l - PAD.r)) * (points.length - 1))
          setHover(Math.max(0, Math.min(points.length - 1, i)))
        }}
      >
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid, #e5e7eb)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted, #888)">
              {usd(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? (
            <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted, #888)">
              {p.date}
            </text>
          ) : null
        )}
        {hv && (
          <line x1={xs(hover as number)} x2={xs(hover as number)} y1={PAD.t} y2={H - PAD.b} stroke="var(--baseline, #999)" strokeWidth="1" />
        )}
        <path d={path((p) => p.buyHoldValue)} fill="none" stroke="#a97a34" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path((p) => p.strategyValue)} fill="none" stroke="#5487c3" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hv && (
          <>
            <circle cx={xs(hover as number)} cy={ys(hv.buyHoldValue)} r="4" fill="#a97a34" stroke="var(--surface-1, #fff)" strokeWidth="2" />
            <circle cx={xs(hover as number)} cy={ys(hv.strategyValue)} r="4" fill="#5487c3" stroke="var(--surface-1, #fff)" strokeWidth="2" />
          </>
        )}
      </svg>
      {hv && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 70,
            background: 'var(--surface-1, #fff)',
            border: '1px solid var(--border, #ddd)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ color: 'var(--text-muted, #888)' }}>{hv.date}</div>
          <div>섀넌의 도깨비 {usd(hv.strategyValue)}</div>
          <div>Buy&amp;Hold {usd(hv.buyHoldValue)}</div>
        </div>
      )}
    </div>
  )
}
