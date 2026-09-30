import { useContainerWidth } from '@/shared/hooks/use-container-width'
import { kstDateOnly } from '@/features/vr/lib/format'
import type { VrFill } from '@/features/vr/api/types'

/** 3개 차트 공통: fills는 fillDate 오름차순(시간순) 정렬된 상태로 전달돼야 함 */
interface TrendChartProps {
  fills: VrFill[]
  /** fills index 구간(from~to, 포함)별 라벨 + 구간 사이 세로 점선 — 여러 사이클을 이어 그릴 때 경계 표시용 */
  bands?: Band[]
}

export interface Band {
  from: number
  to: number
  label: string
}

function Bands({ bands, xs, top, bottom }: { bands?: Band[]; xs: (i: number) => number; top: number; bottom: number }) {
  if (!bands) return null
  return (
    <>
      {bands.map((b, i) => (
        <g key={i}>
          {i > 0 && (
            <line
              x1={(xs(b.from) + xs(b.from - 1)) / 2}
              x2={(xs(b.from) + xs(b.from - 1)) / 2}
              y1={top - 4}
              y2={bottom}
              stroke="var(--muted-foreground)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          )}
          <text x={(xs(b.from) + xs(b.to)) / 2} y={top - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            {b.label}
          </text>
        </g>
      ))}
    </>
  )
}

function XAxisDates({
  fills,
  xs,
  H,
  PAD,
}: {
  fills: VrFill[]
  xs: (i: number) => number
  H: number
  PAD: { b: number }
}) {
  return (
    <>
      {fills.map((f, i) =>
        i % Math.ceil(fills.length / 8) === 0 || i === fills.length - 1 ? (
          <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            {kstDateOnly(f.fillDate)}
          </text>
        ) : null
      )}
    </>
  )
}

/** 평단(avgPriceAfter) 추이 라인차트 */
export function AvgPriceChart({ fills, bands, showFillPrice }: TrendChartProps & { showFillPrice?: boolean }) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (fills.length < 2) return null
  const W = Math.max(280, width)
  const H = 150
  const PAD = { l: 48, r: 20, t: bands ? 22 : 10, b: 24 }
  const vals = fills.map((f) => f.avgPriceAfter).concat(showFillPrice ? fills.map((f) => f.price) : [])
  const vMin = Math.min(...vals) * 0.98
  const vMax = Math.max(...vals) * 1.02
  const xs = (i: number) => PAD.l + (i / (fills.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - (v - vMin) / (vMax - vMin || 1)) * (H - PAD.t - PAD.b)
  const line = fills.map((f, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(f.avgPriceAfter).toFixed(1)}`).join(' ')
  const last = fills[fills.length - 1]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[vMin, (vMin + vMax) / 2, vMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <Bands bands={bands} xs={xs} top={PAD.t} bottom={H - PAD.b} />
        {showFillPrice && (
          <path
            d={fills.map((f, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(f.price).toFixed(1)}`).join(' ')}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        )}
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={xs(fills.length - 1)} cy={ys(last.avgPriceAfter)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(fills.length - 1) - 8} y={ys(last.avgPriceAfter) - 8} textAnchor="end" fontSize="11" fill="var(--foreground)">
          ${last.avgPriceAfter.toFixed(2)}
        </text>
        <XAxisDates fills={fills} xs={xs} H={H} PAD={PAD} />
      </svg>
    </div>
  )
}

/** 보유수량(qtyAfter) 추이 스텝차트 */
export function QuantityChart({ fills, bands }: TrendChartProps) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (fills.length < 2) return null
  const W = Math.max(280, width)
  const H = 150
  const PAD = { l: 36, r: 20, t: bands ? 22 : 10, b: 24 }
  const qMax = Math.max(1, ...fills.map((f) => f.qtyAfter))
  const xs = (i: number) => PAD.l + (i / (fills.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - v / qMax) * (H - PAD.t - PAD.b)
  let d = `M${xs(0)},${ys(0)}`
  fills.forEach((f, i) => {
    const before = i === 0 ? 0 : fills[i - 1].qtyAfter
    d += ` L${xs(i)},${ys(before)} L${xs(i)},${ys(f.qtyAfter)}`
  })
  const last = fills[fills.length - 1]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[0, qMax / 2, qMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              {Math.round(v)}
            </text>
          </g>
        ))}
        <Bands bands={bands} xs={xs} top={PAD.t} bottom={H - PAD.b} />
        <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={xs(fills.length - 1)} cy={ys(last.qtyAfter)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(fills.length - 1) - 8} y={ys(last.qtyAfter) - 8} textAnchor="end" fontSize="11" fill="var(--foreground)">
          {last.qtyAfter}주
        </text>
        <XAxisDates fills={fills} xs={xs} H={H} PAD={PAD} />
      </svg>
    </div>
  )
}

/** Pool(현금 여력) 추이 영역+라인차트 */
export function PoolChart({ fills }: TrendChartProps) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (fills.length < 2) return null
  const W = Math.max(280, width)
  const H = 150
  const PAD = { l: 56, r: 20, t: 10, b: 24 }
  const vals = fills.map((f) => f.poolAfter)
  const vMin = Math.min(0, ...vals)
  const vMax = Math.max(1, ...vals)
  const xs = (i: number) => PAD.l + (i / (fills.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - (v - vMin) / (vMax - vMin)) * (H - PAD.t - PAD.b)
  const line = fills.map((f, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(f.poolAfter).toFixed(1)}`).join(' ')
  const area = `${line} L${xs(fills.length - 1)},${ys(vMin)} L${xs(0)},${ys(vMin)} Z`
  const last = fills[fills.length - 1]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {[vMin, (vMin + vMax) / 2, vMax].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              {Math.round(v)}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--primary)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={xs(fills.length - 1)} cy={ys(last.poolAfter)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(fills.length - 1) - 8} y={ys(last.poolAfter) - 8} textAnchor="end" fontSize="11" fill="var(--foreground)">
          ${last.poolAfter.toFixed(0)}
        </text>
        <XAxisDates fills={fills} xs={xs} H={H} PAD={PAD} />
      </svg>
    </div>
  )
}

const dayNum = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000
const shortDate = (s: string) => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`

export interface BandCycle {
  cycleNo: number
  startDate: string
  endDate: string | null
  minBand: number
  maxBand: number
}

/**
 * 평가금(선)이 사이클별 V 최소~최대 밴드(띠) 안에서 움직이는 모습 — x축은 날짜 비례.
 * 밴드는 사이클 안에서 고정이고 새 사이클 시작에 계단식으로 바뀐다. 밴드 밖으로 나간 기록은 경고색 점으로 강조.
 */
export function BandChart({ cycles, points }: { cycles: BandCycle[]; points: { date: string; value: number }[] }) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (cycles.length === 0) return null
  const sorted = [...cycles].sort((a, b) => a.cycleNo - b.cycleNo)
  const W = Math.max(280, width)
  const H = 220
  const PAD = { l: 52, r: 20, t: 26, b: 24 }
  const lastDate = points.length > 0 ? points[points.length - 1].date : sorted[sorted.length - 1].startDate
  const lastCycleEnd = sorted[sorted.length - 1].endDate ?? lastDate
  const endDate = lastCycleEnd > lastDate ? lastCycleEnd : lastDate
  const x0 = dayNum(sorted[0].startDate)
  const x1 = Math.max(dayNum(endDate), dayNum(lastDate))
  const xs = (s: string) => PAD.l + ((dayNum(s) - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r)

  const segs = sorted.map((c, i) => ({ c, a: c.startDate, b: i < sorted.length - 1 ? sorted[i + 1].startDate : endDate }))
  const cycleOf = (date: string) => sorted.filter((c) => c.startDate <= date).pop() ?? null

  const lo = Math.min(...sorted.map((c) => c.minBand), ...points.map((p) => p.value)) * 0.9
  const hi = Math.max(...sorted.map((c) => c.maxBand), ...points.map((p) => p.value)) * 1.05
  const step = hi - lo > 4000 ? 1000 : 500
  const yMin = Math.floor(lo / step) * step
  const yMax = Math.ceil(hi / step) * step
  const ys = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
  const ticks: number[] = []
  for (let v = yMin; v <= yMax; v += step) ticks.push(v)

  const stepPath = (key: 'minBand' | 'maxBand') =>
    segs
      .map((g, i) => `${i ? 'L' : 'M'}${xs(g.a).toFixed(1)},${ys(g.c[key]).toFixed(1)} L${xs(g.b).toFixed(1)},${ys(g.c[key]).toFixed(1)}`)
      .join(' ')
  const lower = [...segs]
    .reverse()
    .map((g) => `L${xs(g.b).toFixed(1)},${ys(g.c.minBand).toFixed(1)} L${xs(g.a).toFixed(1)},${ys(g.c.minBand).toFixed(1)}`)
    .join(' ')
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xs(p.date).toFixed(1)},${ys(p.value).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const outPoints = points.filter((p) => {
    const c = cycleOf(p.date)
    return c ? p.value < c.minBand || p.value > c.maxBand : false
  })

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              ${v.toLocaleString('en-US')}
            </text>
          </g>
        ))}
        <path d={`${stepPath('maxBand')} ${lower} Z`} fill="#7a5fd0" opacity="0.13" />
        <path d={stepPath('maxBand')} fill="none" stroke="#7a5fd0" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d={stepPath('minBand')} fill="none" stroke="#7a5fd0" strokeWidth="1.4" strokeDasharray="4 3" />
        {segs.map((g, i) => (
          <g key={g.c.cycleNo}>
            {i > 0 && (
              <line x1={xs(g.a)} x2={xs(g.a)} y1={PAD.t - 4} y2={H - PAD.b} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 3" />
            )}
            <text x={(xs(g.a) + xs(g.b)) / 2} y={PAD.t - 9} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
              {g.c.cycleNo}
            </text>
          </g>
        ))}
        {points.length > 1 && <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinejoin="round" />}
        {outPoints.map((p) => (
          <circle key={p.date} cx={xs(p.date)} cy={ys(p.value)} r="4" fill="var(--status-critical)" stroke="var(--card)" strokeWidth="1.5" />
        ))}
        {last && (
          <>
            <circle cx={xs(last.date)} cy={ys(last.value)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
            <text x={xs(last.date) - 8} y={ys(last.value) + 16} textAnchor="end" fontSize="11" fill="var(--foreground)">
              ${Math.round(last.value).toLocaleString('en-US')}
            </text>
          </>
        )}
        {[sorted[0].startDate, ...sorted.filter((_, i) => i > 0 && i % 2 === 0).map((c) => c.startDate), endDate].map((d, i) => (
          <text key={`${d}-${i}`} x={xs(d)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
            {shortDate(d)}
          </text>
        ))}
      </svg>
    </div>
  )
}

/** 누적 정리 차트 — 계좌총액(실선)과 투자원금(점선)을 날짜 비례 x축에 겹쳐 그림. 선이 점선 위/아래로 오가는 게 곧 수익/손실 */
export function CumulativeChart({ points }: { points: { date: string; totalAssets: number; principal: number }[] }) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (points.length < 2) return null
  const W = Math.max(280, width)
  const H = 200
  const PAD = { l: 52, r: 20, t: 12, b: 24 }
  const x0 = dayNum(points[0].date)
  const x1 = dayNum(points[points.length - 1].date)
  const xs = (s: string) => PAD.l + ((dayNum(s) - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r)
  const all = points.flatMap((p) => [p.totalAssets, p.principal])
  const lo = Math.floor((Math.min(...all) * 0.95) / 500) * 500
  const hi = Math.ceil((Math.max(...all) * 1.03) / 500) * 500
  const ys = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b)
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += (hi - lo) / 4) ticks.push(v)
  const path = (key: 'totalAssets' | 'principal') =>
    points.map((p, i) => `${i ? 'L' : 'M'}${xs(p.date).toFixed(1)},${ys(p[key]).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  const labelDates = [points[0].date, points[Math.floor(points.length / 2)].date, last.date]

  return (
    <div ref={chartRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
              ${Math.round(v).toLocaleString('en-US')}
            </text>
          </g>
        ))}
        <path d={path('principal')} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.6" strokeDasharray="4 3" />
        <path d={path('totalAssets')} fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx={xs(last.date)} cy={ys(last.totalAssets)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={xs(last.date) - 8} y={ys(last.totalAssets) - 8} textAnchor="end" fontSize="11" fill="var(--foreground)">
          ${Math.round(last.totalAssets).toLocaleString('en-US')}
        </text>
        {labelDates.map((d, i) => (
          <text key={d} x={xs(d)} y={H - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontSize="10" fill="var(--muted-foreground)">
            {shortDate(d)}
          </text>
        ))}
      </svg>
    </div>
  )
}
