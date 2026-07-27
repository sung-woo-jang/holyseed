import { useContainerWidth } from '@/shared/hooks/use-container-width'
import { kstDateOnly } from '@/features/vr/lib/format'
import type { VrFill } from '@/features/vr/api/types'

/** 3개 차트 공통: fills는 fillDate 오름차순(시간순) 정렬된 상태로 전달돼야 함 */
interface TrendChartProps {
  fills: VrFill[]
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
export function AvgPriceChart({ fills }: TrendChartProps) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (fills.length < 2) return null
  const W = Math.max(280, width)
  const H = 150
  const PAD = { l: 48, r: 20, t: 10, b: 24 }
  const vals = fills.map((f) => f.avgPriceAfter)
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
export function QuantityChart({ fills }: TrendChartProps) {
  const { ref: chartRef, width } = useContainerWidth<HTMLDivElement>(720)
  if (fills.length < 2) return null
  const W = Math.max(280, width)
  const H = 150
  const PAD = { l: 36, r: 20, t: 10, b: 24 }
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
