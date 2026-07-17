import type { TradeDto } from '@/features/laofus/lib/types'
import { n, kstDateOnly } from '@/features/laofus/lib/types'

/** T값 추이 스텝차트 */
export function TChart({ trades }: { trades: TradeDto[] }) {
  const pts = trades.filter((t) => t.kind !== '이월')
  if (pts.length < 2) return null
  const W = 720,
    H = 150,
    PAD = { l: 36, r: 20, t: 10, b: 24 }
  const tMax = Math.max(20, ...pts.map((t) => n(t.tAfter)))
  const xs = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - v / tMax) * (H - PAD.t - PAD.b)
  // 스텝: 각 m차에서 tBefore→tAfter 수직 이동
  let d = `M${xs(0)},${ys(n(pts[0].tBefore))}`
  pts.forEach((t, i) => {
    d += ` L${xs(i)},${ys(n(t.tBefore))} L${xs(i)},${ys(n(t.tAfter))}`
  })
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 480, display: 'block' }}>
        {[0, 10, 20].map(
          (v) =>
            v <= tMax && (
              <g key={v}>
                <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid)" strokeWidth="1" />
                <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                  {v}
                </text>
              </g>
            )
        )}
        {n(pts[pts.length - 1].tAfter) < 20 && (
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={ys(20)}
            y2={ys(20)}
            stroke="var(--status-warning)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        )}
        <path d={d} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinejoin="round" />
        <circle
          cx={xs(pts.length - 1)}
          cy={ys(n(pts[pts.length - 1].tAfter))}
          r="4"
          fill="var(--series-1)"
          stroke="var(--surface-1)"
          strokeWidth="2"
        />
        <text
          x={xs(pts.length - 1) - 8}
          y={ys(n(pts[pts.length - 1].tAfter)) - 8}
          textAnchor="end"
          fontSize="11"
          fill="var(--text-secondary)"
        >
          T={n(pts[pts.length - 1].tAfter)}
        </text>
        {pts.map((t, i) =>
          i % Math.ceil(pts.length / 8) === 0 || i === pts.length - 1 ? (
            <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {t.seq}차
            </text>
          ) : null
        )}
      </svg>
    </div>
  )
}

/** 누적 투입금 vs 잔금 */
export function CashChart({ trades, principal }: { trades: TradeDto[]; principal: number }) {
  const pts = trades.filter((t) => t.kind !== '이월')
  if (pts.length < 2) return null
  const W = 720,
    H = 150,
    PAD = { l: 48, r: 20, t: 10, b: 24 }
  const xs = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r)
  const ys = (v: number) => PAD.t + (1 - v / principal) * (H - PAD.t - PAD.b)
  let invested = 0
  const investedPts = pts.map((t) => {
    if (t.side === 'BUY') invested += n(t.amount)
    else invested = Math.max(0, invested - n(t.amount))
    return invested
  })
  const line = (get: (i: number) => number) =>
    pts.map((_, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(get(i)).toFixed(1)}`).join(' ')
  const investedArea = `${line((i) => investedPts[i])} L${xs(pts.length - 1)},${ys(0)} L${xs(0)},${ys(0)} Z`
  return (
    <div style={{ overflowX: 'auto' }}>
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
          누적 투입
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
          잔금
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 480, display: 'block' }}>
        {[0, principal / 2, principal].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke="var(--grid)" strokeWidth="1" />
            <text x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {Math.round(v)}
            </text>
          </g>
        ))}
        <path d={investedArea} fill="var(--series-1)" opacity="0.1" />
        <path
          d={line((i) => investedPts[i])}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d={line((i) => n(pts[i].cashAfter))}
          fill="none"
          stroke="var(--series-2)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {pts.map((t, i) =>
          i % Math.ceil(pts.length / 8) === 0 || i === pts.length - 1 ? (
            <text key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {kstDateOnly(t.date)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  )
}
