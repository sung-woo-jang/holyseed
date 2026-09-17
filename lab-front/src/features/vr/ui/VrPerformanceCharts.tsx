import { useContainerWidth } from '@/shared/hooks/use-container-width'
import { kstDateOnly } from '@/features/vr/lib/format'
import type { VrCycle, VrWealthHistoryPoint, VrSpyComparisonPoint } from '@/features/vr/api/types'

function xAxisLabels<T>(items: T[], label: (item: T, i: number) => string, xs: (i: number) => number, H: number, PAD: { b: number }) {
  return items.map((item, i) =>
    i % Math.ceil(items.length / 8) === 0 || i === items.length - 1 ? (
      <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
        {label(item, i)}
      </text>
    ) : null,
  )
}

/** 전체 사이클 누적 V값 + 최소/최대 밴드 추이 — 사이클을 이어붙인 장기 그래프 (VrTrendPage는 사이클 1개만 보여줌) */
export function CumulativeBandChart({ cycles }: { cycles: VrCycle[] }) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (cycles.length < 2) return null
  const W = Math.max(280, width)
  const H = 220
  const PAD = { l: 60, r: 20, t: 16, b: 24 }
  const vMin = Math.min(...cycles.map((c) => c.minBand)) * 0.95
  const vMax = Math.max(...cycles.map((c) => c.maxBand)) * 1.05
  const xs = (i: number) => PAD.l + (i / (cycles.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - (v - vMin) / (vMax - vMin || 1)) * (H - PAD.t - PAD.b)

  const vLine = cycles.map((c, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(c.vValue).toFixed(1)}`).join(' ')
  const maxLine = cycles.map((c, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(c.maxBand).toFixed(1)}`).join(' ')
  const minLine = cycles.map((c, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(c.minBand).toFixed(1)}`).join(' ')
  const bandArea = `${maxLine} ${cycles
    .slice()
    .reverse()
    .map((c) => `L${xs(cycles.indexOf(c)).toFixed(1)},${ys(c.minBand).toFixed(1)}`)
    .join(' ')} Z`
  const last = cycles[cycles.length - 1]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[vMin, (vMin + vMax) / 2, vMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        <path d={bandArea} fill="var(--primary)" opacity="0.06" />
        <path d={maxLine} fill="none" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <path d={minLine} fill="none" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <path d={vLine} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={xs(cycles.length - 1)} cy={ys(last.vValue)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(cycles.length - 1) - 8} y={ys(last.vValue) - 10} textAnchor="end" fontSize="11" fill="var(--foreground)">
          V {last.vValue.toFixed(0)}
        </text>
        {xAxisLabels(cycles, (c) => `${c.cycleNo}회`, xs, H, PAD)}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5" style={{ background: 'var(--primary)' }} />V값
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5 opacity-50" style={{ background: 'var(--primary)', borderTop: '1px dashed' }} />
          최소·최대 밴드
        </span>
      </div>
    </div>
  )
}

/** TQQQ 평가금(실선) vs 누적 투자원금(점선) — laofus.account_snapshots + vr_fills(INITIAL_BUY/DEPOSIT)에서 파생 */
export function WealthVsPrincipalChart({ points }: { points: VrWealthHistoryPoint[] }) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (points.length < 2) return null
  const W = Math.max(280, width)
  const H = 220
  const PAD = { l: 64, r: 20, t: 16, b: 24 }
  const vMin = 0
  const vMax = Math.max(...points.map((p) => Math.max(p.tqqqValue, p.cumulativePrincipal))) * 1.08
  const xs = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - (v - vMin) / (vMax - vMin || 1)) * (H - PAD.t - PAD.b)

  const valueLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.tqqqValue).toFixed(1)}`).join(' ')
  const principalLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.cumulativePrincipal).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[vMin, vMax / 2, vMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              ${Math.round(v).toLocaleString()}
            </text>
          </g>
        ))}
        <path d={principalLine} fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={valueLine} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={xs(points.length - 1)} cy={ys(last.tqqqValue)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(points.length - 1) - 8} y={ys(last.tqqqValue) - 10} textAnchor="end" fontSize="11" fill="var(--foreground)">
          ${last.tqqqValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </text>
        {xAxisLabels(points, (p) => kstDateOnly(p.date), xs, H, PAD)}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5" style={{ background: 'var(--primary)' }} />
          TQQQ 평가금
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5" style={{ background: 'var(--muted-foreground)' }} />
          누적 투자원금
        </span>
      </div>
    </div>
  )
}

/** TQQQ 평가금 vs SPY, 첫 공통일=0%로 정규화한 수익률(%) 비교 */
export function SpyComparisonChart({ points }: { points: VrSpyComparisonPoint[] }) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (points.length < 2) return null
  const W = Math.max(280, width)
  const H = 220
  const PAD = { l: 52, r: 20, t: 16, b: 24 }
  const all = points.flatMap((p) => [p.tqqqPct, p.spyPct])
  const vMin = Math.min(0, ...all) * 1.1
  const vMax = Math.max(0, ...all) * 1.1
  const xs = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - (v - vMin) / (vMax - vMin || 1)) * (H - PAD.t - PAD.b)

  const tqqqLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.tqqqPct).toFixed(1)}`).join(' ')
  const spyLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.spyPct).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[vMin, 0, vMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth={v === 0 ? 1.5 : 1} />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              {v.toFixed(0)}%
            </text>
          </g>
        ))}
        <path d={spyLine} fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={tqqqLine} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={xs(points.length - 1)} cy={ys(last.tqqqPct)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(points.length - 1) - 8} y={ys(last.tqqqPct) - 10} textAnchor="end" fontSize="11" fill="var(--foreground)">
          {last.tqqqPct >= 0 ? '+' : ''}
          {last.tqqqPct.toFixed(1)}%
        </text>
        {xAxisLabels(points, (p) => kstDateOnly(p.date), xs, H, PAD)}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5" style={{ background: 'var(--primary)' }} />
          TQQQ 평가금 {last.tqqqPct >= 0 ? '+' : ''}
          {last.tqqqPct.toFixed(1)}%
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5" style={{ background: 'var(--muted-foreground)' }} />
          SPY {last.spyPct >= 0 ? '+' : ''}
          {last.spyPct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
