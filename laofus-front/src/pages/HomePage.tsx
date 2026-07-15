import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyFill, computeIndicators, decide } from '@holyseed/laofus-core'
import type { ImuState } from '@holyseed/laofus-core'
import { EngineStatusBar, ErrorBanner, Tile } from '@/components/ui'
import { kst, n, usd } from '@/lib/types'
import { usePrice, useStatus } from '@/lib/useStatus'

/** 판단 구간 밴드 — 가격축에 매수/매도 구간 + 현재가/시뮬 마커 */
function DecisionBand({ s, price, simPrice }: { s: ImuState; price: number | null; simPrice: number }) {
  const ind = computeIndicators(s)
  const firstHalf = s.T < 20
  const lo = Math.min(s.avgPrice * 0.75, (price ?? s.avgPrice) * 0.9)
  const hi = ind.fullSellPrice * 1.08
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100

  const zones = firstHalf
    ? [
        { from: lo, to: s.avgPrice, label: '전액 매수', color: 'var(--series-1)', op: 0.28 },
        { from: s.avgPrice, to: ind.starPrice, label: '절반 매수', color: 'var(--series-1)', op: 0.14 },
        { from: ind.starPrice, to: ind.fullSellPrice, label: '쿼터매도', color: 'var(--status-critical)', op: 0.14 },
        { from: ind.fullSellPrice, to: hi, label: '전량매도', color: 'var(--status-critical)', op: 0.28 },
      ]
    : [
        { from: lo, to: ind.starPrice, label: '전액 매수', color: 'var(--series-1)', op: 0.28 },
        { from: ind.starPrice, to: ind.fullSellPrice, label: '쿼터매도', color: 'var(--status-critical)', op: 0.14 },
        { from: ind.fullSellPrice, to: hi, label: '전량매도', color: 'var(--status-critical)', op: 0.28 },
      ]

  const marks = [
    { v: s.avgPrice, label: `평단 ${usd(s.avgPrice)}` },
    { v: ind.starPrice, label: `별지점 ${usd(ind.starPrice)}` },
    { v: ind.fullSellPrice, label: `+20% ${usd(ind.fullSellPrice)}` },
  ]

  return (
    <div>
      <div
        style={{
          position: 'relative',
          height: 44,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--grid)',
        }}
      >
        {zones.map((z, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x(z.from)}%`,
              width: `${x(z.to) - x(z.from)}%`,
              top: 0,
              bottom: 0,
              background: `color-mix(in srgb, ${z.color} ${z.op * 100}%, var(--surface-1))`,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 4,
                left: 6,
                fontSize: 11,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {z.label}
            </span>
          </div>
        ))}
        {price !== null && price >= lo && price <= hi && (
          <div
            style={{
              position: 'absolute',
              left: `${x(price)}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'var(--text-primary)',
            }}
            title={`현재가 ${usd(price)}`}
          />
        )}
        {simPrice >= lo && simPrice <= hi && simPrice !== price && (
          <div
            style={{
              position: 'absolute',
              left: `${x(simPrice)}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'var(--text-muted)',
              opacity: 0.7,
            }}
          />
        )}
      </div>
      <div style={{ position: 'relative', height: 18, fontSize: 10, color: 'var(--text-muted)' }}>
        {marks.map((m) => (
          <span
            key={m.label}
            style={{ position: 'absolute', left: `${x(m.v)}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
          >
            {m.label}
          </span>
        ))}
      </div>
      {price !== null && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          ▐ 현재가 {usd(price)} {simPrice !== price ? ` · ▏시뮬 ${usd(simPrice)}` : ''}
        </div>
      )}
    </div>
  )
}

function DecisionPreview({ s, price, title }: { s: ImuState; price: number; title: string }) {
  const d = decide(s, price)
  let text: string
  let after: string | null = null
  if (d.action === 'BUY') {
    text = `매수(${d.kind}) ${usd(d.amountUsd)}`
    const q = d.amountUsd / price
    const nx = applyFill(s, d, { quantity: q, price, amount: d.amountUsd })
    after = `→ T ${s.T} → ${d.tAfter} · 예상 평단 ${usd(nx.avgPrice)} · 잔금 ${usd(nx.cash)}`
  } else if (d.action === 'SELL') {
    text = `매도(${d.kind}) ${d.quantity.toFixed(6)}주 ≈ ${usd(d.quantity * price)}`
    const nx = applyFill(s, d, { quantity: d.quantity, price, amount: d.quantity * price })
    after = `→ T ${s.T} → ${nx.T} · 잔금 ${usd(nx.cash)}${nx.quantity === 0 ? ' · 사이클 종료' : ''}`
  } else {
    text = `주문 없음 — ${d.reason}`
  }
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--page)', border: '1px solid var(--grid)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{title}</div>
      <div
        style={{
          fontWeight: 600,
          color:
            d.action === 'SELL'
              ? 'var(--status-critical)'
              : d.action === 'BUY'
                ? 'var(--series-1)'
                : 'var(--text-secondary)',
        }}
      >
        {text}
      </div>
      {after && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{after}</div>}
    </div>
  )
}

export default function HomePage() {
  const { status } = useStatus()
  const price = usePrice()
  const [simInput, setSimInput] = useState<string>('')

  const s: ImuState | null = useMemo(() => {
    const st = status?.state
    if (!st) return null
    return {
      cycle: st.cycleNo,
      T: n(st.t),
      quantity: n(st.quantity),
      avgPrice: n(st.avgPrice),
      cash: n(st.cash),
      principal: n(st.principal),
    }
  }, [status])

  if (!status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )

  const ind = s ? computeIndicators(s) : null
  const pnl = s && price ? (price.price - s.avgPrice) * s.quantity : null
  const simPrice = simInput !== '' && !Number.isNaN(Number(simInput)) ? Number(simInput) : (price?.price ?? 0)

  return (
    <main className="wrap">
      <ErrorBanner status={status} />
      <EngineStatusBar />

      {s && ind && status.state && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Tile
              label={`T값 (${s.cycle}차 사이클)`}
              value={String(s.T)}
              sub={status.state.cycleDone ? '사이클 종료 — 수동 확인' : s.T < 20 ? '전반전' : '후반전'}
            />
            <Tile label="보유수량" value={s.quantity.toFixed(6)} sub={`평단 ${usd(s.avgPrice)}`} />
            <Tile
              label="현재가"
              value={price ? usd(price.price) : '—'}
              sub={pnl !== null ? `평가손익 ${pnl >= 0 ? '+' : ''}${usd(pnl)}` : undefined}
            />
            <Tile label="별지점" value={usd(ind.starPrice)} sub={`별 ${(ind.starPct * 100).toFixed(2)}%`} />
            <Tile label="1회매수금" value={usd(ind.oneBuyAmount)} sub={`잔금 ${usd(s.cash)}`} />
            <Tile label="전량매도가" value={usd(ind.fullSellPrice)} sub="평단 +20%" />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>오늘의 판단 미리보기</h2>
            <DecisionBand s={s} price={price?.price ?? null} simPrice={simPrice} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 10,
                marginTop: 14,
              }}
            >
              {price && (
                <DecisionPreview s={s} price={price.price} title={`지금 마감이면 (현재가 ${usd(price.price)})`} />
              )}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>가상 가격 시뮬레이터</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="range"
                    min={Math.floor(s.avgPrice * 0.7)}
                    max={Math.ceil(ind.fullSellPrice * 1.1)}
                    step="0.5"
                    value={simPrice}
                    onChange={(e) => setSimInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    value={simInput === '' ? (price?.price ?? '') : simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    style={{
                      width: 90,
                      font: 'inherit',
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-1)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                {simPrice > 0 && <DecisionPreview s={s} price={simPrice} title={`종가가 ${usd(simPrice)} 이라면`} />}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8 }}>
          <h2 style={{ fontSize: 15 }}>최근 이벤트</h2>
          <Link to="/system" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--series-1)' }}>
            전체 보기 →
          </Link>
        </div>
        {status.events.slice(0, 5).map((e) => (
          <div
            key={e.id}
            style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid var(--grid)', fontSize: 13 }}
          >
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{kst(e.ts)}</span>
            <span
              style={{
                fontWeight: 600,
                width: 38,
                color:
                  e.level === 'error'
                    ? 'var(--status-critical)'
                    : e.level === 'warn'
                      ? 'var(--status-warning)'
                      : 'var(--text-secondary)',
              }}
            >
              {e.level}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
