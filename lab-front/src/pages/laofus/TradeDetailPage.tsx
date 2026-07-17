import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { computeIndicators } from '@holyseed/laofus-core'
import type { ImuState } from '@holyseed/laofus-core'
import { Tile } from '@/features/laofus/ui/ui'
import type { TossOrderDto } from '@/features/laofus/lib/types'
import { api, kst, kstDateOnly, n, usd } from '@/features/laofus/lib/types'
import { useStatus } from '@/features/laofus/lib/useStatus'

export default function TradeDetailPage() {
  const { status } = useStatus()
  const { cycleNo, seq } = useParams()
  const [order, setOrder] = useState<TossOrderDto | null>(null)
  const [orderErr, setOrderErr] = useState<string | null>(null)

  const cycle = status?.cycles.find((x) => x.cycleNo === Number(cycleNo))
  const trade = cycle?.trades.find((t) => t.seq === Number(seq))

  useEffect(() => {
    if (!trade?.orderId) return
    let alive = true
    api<TossOrderDto>(`/api/laofus/order?orderId=${encodeURIComponent(trade.orderId)}`)
      .then((o) => alive && setOrder(o))
      .catch((e) => alive && setOrderErr(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [trade?.orderId])

  if (!status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )

  if (!cycle || !trade)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>
          거래 없음 — <Link to="/laofus/cycles">사이클 목록</Link>
        </p>
      </main>
    )

  // 직전 상태 재구성: 이전 seq 거래(이월 포함)의 after 필드가 이 거래의 before
  const idx = cycle.trades.findIndex((t) => t.id === trade.id)
  const prev = idx > 0 ? cycle.trades[idx - 1] : null
  const before = prev
    ? { qty: n(prev.qtyAfter), avg: n(prev.avgAfter), cash: n(prev.cashAfter) }
    : { qty: 0, avg: 0, cash: n(cycle.principal) }
  const after = { qty: n(trade.qtyAfter), avg: n(trade.avgAfter), cash: n(trade.cashAfter) }

  // 당시 판단 컨텍스트 — 이월/초기(평단 0)에는 지표가 무의미
  const canIndicate = trade.kind !== '이월' && before.avg > 0 && before.qty > 0
  const ind = canIndicate
    ? computeIndicators({
        cycle: cycle.cycleNo,
        T: n(trade.tBefore),
        quantity: before.qty,
        avgPrice: before.avg,
        cash: before.cash,
        principal: n(cycle.principal),
      } satisfies ImuState)
    : null

  const isSell = trade.side === 'SELL'

  return (
    <main className="wrap">
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap' }}>
        <Link to={`/laofus/cycles/${cycle.cycleNo}`} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ← {cycle.cycleNo}차 사이클
        </Link>
        <h1 style={{ fontSize: 18 }}>
          {trade.seq}차 거래 —{' '}
          <span style={{ color: isSell ? 'var(--status-critical)' : 'var(--series-1)' }}>{trade.kind}</span>
        </h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{kstDateOnly(trade.date)}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <Tile label="체결가" value={usd(n(trade.price))} />
        <Tile label="수량" value={n(trade.quantity).toFixed(6)} sub={isSell ? '매도' : '매수'} />
        <Tile label="금액" value={usd(n(trade.amount))} />
        <Tile label="T 변화" value={`${n(trade.tBefore)} → ${n(trade.tAfter)}`} />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>전후 상태 비교</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th className="l"></th>
                <th>보유수량</th>
                <th>평단</th>
                <th>잔금</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="l" style={{ color: 'var(--text-muted)' }}>
                  직전
                </td>
                <td>{before.qty.toFixed(6)}</td>
                <td>{before.avg > 0 ? usd(before.avg) : '—'}</td>
                <td>{usd(before.cash)}</td>
              </tr>
              <tr>
                <td className="l" style={{ fontWeight: 600 }}>
                  이후
                </td>
                <td style={{ fontWeight: 600 }}>{after.qty.toFixed(6)}</td>
                <td style={{ fontWeight: 600 }}>{usd(after.avg)}</td>
                <td style={{ fontWeight: 600 }}>{usd(after.cash)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>당시 판단 컨텍스트</h3>
        {ind ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            <Tile label="별%" value={`${(ind.starPct * 100).toFixed(1)}%`} sub={`T=${n(trade.tBefore)} 기준`} />
            <Tile label="별지점" value={usd(ind.starPrice)} />
            <Tile label="1회매수금" value={usd(ind.oneBuyAmount)} />
            <Tile label="전량매도가" value={usd(ind.fullSellPrice)} />
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {trade.kind === '이월' ? '이월 잔고 — 판단 대상 아님' : '초기 상태 — 지표 계산 불가'}
          </p>
        )}
        {trade.note && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>메모: {trade.note}</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>토스 주문</h3>
        {!trade.orderId ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>주문 정보 없음 (dry-run 또는 이관 전 거래)</p>
        ) : orderErr ? (
          <p style={{ color: 'var(--status-critical)', fontSize: 13 }}>주문 조회 실패: {orderErr}</p>
        ) : !order ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>주문 조회 중…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th className="l">주문시각</th>
                  <th className="l">유형</th>
                  <th className="l">상태</th>
                  <th>주문</th>
                  <th>체결수량</th>
                  <th>체결가</th>
                  <th>체결금액</th>
                  <th>수수료</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="l">{kst(order.orderedAt)}</td>
                  <td className="l">{order.orderType}</td>
                  <td className="l">{order.status}</td>
                  <td>{order.orderAmount ? usd(n(order.orderAmount)) : `${n(order.quantity).toFixed(6)}주`}</td>
                  <td>{n(order.execution.filledQuantity).toFixed(6)}</td>
                  <td>{order.execution.averageFilledPrice ? usd(n(order.execution.averageFilledPrice)) : '—'}</td>
                  <td>{order.execution.filledAmount ? usd(n(order.execution.filledAmount)) : '—'}</td>
                  <td>{order.execution.commission ? usd(n(order.execution.commission)) : '—'}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>orderId: {order.orderId}</p>
          </div>
        )}
      </div>
    </main>
  )
}
