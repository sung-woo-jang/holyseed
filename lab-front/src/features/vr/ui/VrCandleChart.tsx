import { useState } from 'react'
import { useContainerWidth } from '@/shared/hooks/use-container-width'
import { n, usd, kst, kstDateOnly, kstTimeOnly } from '@/features/vr/lib/format'
import type { VrCandle, VrCandleRange } from '@/features/vr/api/types'

/** 현재 보유수량 기준으로 환산한 V/밴드 "주가" 라인 — 밴드는 원래 평가금($) 기준이라 quantity로 나눠야 캔들(주가) 차트에 겹칠 수 있음 */
export interface VrPriceLevels {
  vPrice: number
  minPrice: number
  maxPrice: number
}

interface VrCandleChartProps {
  candles: VrCandle[]
  range: VrCandleRange
  levels: VrPriceLevels | null
}

export function VrCandleChart({ candles, range, levels }: VrCandleChartProps) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(960)
  const [hover, setHover] = useState<number | null>(null)

  if (candles.length === 0) return <p className="text-sm text-muted-foreground">캔들 데이터 없음</p>

  const W = Math.max(320, width)
  const H = 380
  const PAD = { l: 8, r: 64, t: 12, b: 26 }
  const vals = candles.flatMap((c) => [n(c.highPrice), n(c.lowPrice)])
  if (levels) vals.push(levels.vPrice, levels.minPrice, levels.maxPrice)
  const yMin = Math.min(...vals) * 0.99
  const yMax = Math.max(...vals) * 1.01
  const ys = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
  const bw = (W - PAD.l - PAD.r) / candles.length
  const xs = (i: number) => PAD.l + i * bw + bw / 2

  const ticks: number[] = []
  const step = Math.max(1, Math.round((yMax - yMin) / 6))
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v)

  const hv = hover !== null ? candles[hover] : null
  const levelLines = levels
    ? [
        { v: levels.maxPrice, label: `최대밴드 ${usd(levels.maxPrice)}`, color: 'var(--destructive)' },
        { v: levels.vPrice, label: `V ${usd(levels.vPrice)}`, color: 'var(--primary)' },
        { v: levels.minPrice, label: `최소밴드 ${usd(levels.minPrice)}`, color: '#f59e0b' },
      ]
    : []

  return (
    <div className="relative">
      <div ref={chartRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
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
              <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
              <text x={W - PAD.r + 6} y={ys(v) + 4} fontSize="10" fill="var(--muted-foreground)">
                {v}
              </text>
            </g>
          ))}
          {candles.map((c, i) =>
            i % Math.ceil(candles.length / 8) === 0 ? (
              <text
                key={i}
                x={xs(i)}
                y={H - PAD.b + 14}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted-foreground)"
              >
                {range === 'intraday' ? kstTimeOnly(c.timestamp) : kstDateOnly(c.timestamp)}
              </text>
            ) : null
          )}
          {/* 캔들 */}
          {candles.map((c, i) => {
            const o = n(c.openPrice)
            const cl = n(c.closePrice)
            const up = cl >= o
            const color = up ? '#10b981' : 'var(--destructive)'
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
          {/* V/밴드 레벨 라인 */}
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
              <text x={PAD.l + 4} y={ys(l.v) - 4} fontSize="11" fill="var(--foreground)">
                {l.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {hv && (
        <div className="pointer-events-none absolute left-6 top-5 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
          <div className="text-muted-foreground">
            {range === 'intraday' ? kst(hv.timestamp) : kstDateOnly(hv.timestamp)}
          </div>
          <div>
            시 {usd(n(hv.openPrice))} · 고 {usd(n(hv.highPrice))} · 저 {usd(n(hv.lowPrice))} · 종{' '}
            <strong>{usd(n(hv.closePrice))}</strong>
          </div>
          <div className="text-muted-foreground">거래량 {n(hv.volume).toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}
