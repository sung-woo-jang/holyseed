import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tile } from '@/features/laofus/ui/ui'
import type { AccountDto, TossOrderDto } from '@/features/laofus/lib/types'
import { api, krw, kst, n, usd } from '@/features/laofus/lib/types'
import { useStatus } from '@/features/laofus/lib/useStatus'

/** orderId → 해당 무매 거래 링크 정보 */
type TradeLinkMap = Map<string, { cycleNo: number; seq: number }>

export default function AccountPage() {
  const { status } = useStatus()
  const [account, setAccount] = useState<AccountDto | null>(null)
  const [orders, setOrders] = useState<{ open: TossOrderDto[]; closed: TossOrderDto[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tradeLinks: TradeLinkMap = useMemo(() => {
    const m: TradeLinkMap = new Map()
    for (const c of status?.cycles ?? [])
      for (const t of c.trades) if (t.orderId) m.set(t.orderId, { cycleNo: c.cycleNo, seq: t.seq })
    return m
  }, [status?.cycles])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [a, o] = await Promise.all([
          api<AccountDto>('/api/laofus/account'),
          api<{ open: TossOrderDto[]; closed: TossOrderDto[] }>('/api/laofus/orders'),
        ])
        if (alive) {
          setAccount(a)
          setOrders(o)
          setError(null)
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  if (error)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--status-critical)' }}>{error}</p>
      </main>
    )
  if (!account || !orders)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중… (토스 API 조회)</p>
      </main>
    )

  const soxl = account.holdings.items.find((h) => h.symbol === 'SOXL')
  const dbQty = status?.state ? n(status.state.quantity) : null
  const acctQty = soxl ? n(soxl.quantity) : 0
  const match = dbQty !== null && Math.abs(acctQty - dbQty) < 0.0001

  const fx = account.exchangeRate ? n(account.exchangeRate.rate) : null
  const totalUsd = account.holdings.items.reduce((a, h) => a + n(h.marketValue.amount), 0)

  return (
    <main className="wrap">
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>실계좌 (토스증권)</h1>

      {dbQty !== null && (
        <div
          className="card"
          style={{
            marginBottom: 12,
            fontSize: 13,
            borderColor: match ? 'var(--status-good)' : 'var(--status-critical)',
          }}
        >
          {match ? (
            <span style={{ color: 'var(--status-good)' }}>
              ✓ 정합성 OK — SOXL 계좌 보유({acctQty})와 엔진 DB({dbQty}) 일치
            </span>
          ) : (
            <span style={{ color: 'var(--status-critical)' }}>
              ✗ 불일치 — SOXL 계좌 보유 {acctQty} vs 엔진 DB {dbQty}. 엔진은 불일치 시 주문을 중단함. 수동 확인 필요
            </span>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Tile label="주식 평가금 합계" value={usd(totalUsd)} sub={fx ? krw(totalUsd * fx) : undefined} />
        <Tile label="예수금 USD" value={usd(n(account.buyingPower.usd))} />
        <Tile label="예수금 KRW" value={krw(n(account.buyingPower.krw))} />
        {fx && <Tile label="환율 USD/KRW" value={`₩${fx.toLocaleString()}`} />}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>보유 종목</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th className="l">종목</th>
                <th>수량</th>
                <th>평단</th>
                <th>현재가</th>
                <th>평가금</th>
                <th>손익</th>
                <th>일간</th>
              </tr>
            </thead>
            <tbody>
              {account.holdings.items.map((h) => {
                const pl = n(h.profitLoss.amount)
                const dl = n(h.dailyProfitLoss.amount)
                return (
                  <tr key={h.symbol}>
                    <td className="l">
                      <strong>{h.symbol}</strong>
                      {h.symbol === 'SOXL' ? ' (무매)' : h.symbol === 'TQQQ' ? ' (VR)' : ''}
                    </td>
                    <td>{n(h.quantity).toFixed(6)}</td>
                    <td>{usd(n(h.averagePurchasePrice))}</td>
                    <td>{usd(n(h.lastPrice))}</td>
                    <td>{usd(n(h.marketValue.amount))}</td>
                    <td style={{ color: pl >= 0 ? 'var(--delta-good)' : 'var(--status-critical)' }}>
                      {pl >= 0 ? '+' : ''}
                      {usd(pl)} ({(n(h.profitLoss.rate) * 100).toFixed(2)}%)
                    </td>
                    <td style={{ color: dl >= 0 ? 'var(--delta-good)' : 'var(--status-critical)' }}>
                      {dl >= 0 ? '+' : ''}
                      {usd(dl)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>미체결 주문 ({orders.open.length})</h2>
        {orders.open.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>없음</p>
        ) : (
          <OrderTable rows={orders.open} tradeLinks={tradeLinks} />
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>최근 종료 주문 (20건)</h2>
        <OrderTable rows={orders.closed} tradeLinks={tradeLinks} />
      </div>
    </main>
  )
}

function OrderTable({ rows, tradeLinks }: { rows: TossOrderDto[]; tradeLinks: TradeLinkMap }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th className="l">주문시각</th>
            <th className="l">종목</th>
            <th className="l">방향</th>
            <th className="l">유형</th>
            <th className="l">상태</th>
            <th>주문</th>
            <th>체결수량</th>
            <th>체결가</th>
            <th>체결금액</th>
            <th className="l">무매</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const link = tradeLinks.get(o.orderId)
            return (
              <tr key={o.orderId}>
                <td className="l">{kst(o.orderedAt)}</td>
                <td className="l">{o.symbol}</td>
                <td
                  className="l"
                  style={{ color: o.side === 'SELL' ? 'var(--status-critical)' : 'var(--series-1)', fontWeight: 600 }}
                >
                  {o.side === 'SELL' ? '매도' : '매수'}
                </td>
                <td className="l">{o.orderType}</td>
                <td className="l">{o.status}</td>
                <td>{o.orderAmount ? usd(n(o.orderAmount)) : `${n(o.quantity).toFixed(4)}주`}</td>
                <td>{n(o.execution.filledQuantity).toFixed(6)}</td>
                <td>{o.execution.averageFilledPrice ? usd(n(o.execution.averageFilledPrice)) : '—'}</td>
                <td>{o.execution.filledAmount ? usd(n(o.execution.filledAmount)) : '—'}</td>
                <td className="l">
                  {link ? (
                    <Link to={`/laofus/cycles/${link.cycleNo}/trades/${link.seq}`} style={{ fontSize: 12 }}>
                      {link.cycleNo}-{link.seq}차 →
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
