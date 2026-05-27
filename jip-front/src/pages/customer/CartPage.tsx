import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart'
import { useCatalog } from '@/queries/catalog'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const VISIT_FEE = 20000

const STEPS = ['서비스 선택', '견적함', '요청 보내기']

function Steps({ current }: { current: number }) {
  return (
    <div className="steps mb-24">
      {STEPS.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="sep">·</span>}
          {i === current ? (
            <b>
              0{i + 1} {it}
            </b>
          ) : (
            <span>
              0{i + 1} {it}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const { items, remove, clear } = useCartStore()
  const { data: catalog } = useCatalog()
  const allItems = catalog?.flatMap((c) => c.items) ?? []

  const itemsTotal = items.reduce((s, i) => s + i.serviceItemPrice + i.productPrice, 0)
  const visitFee = items.length > 0 ? VISIT_FEE : 0

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <Steps current={1} />
          <div className="empty mt-40">
            <h3 className="h3">아직 담긴 서비스가 없어요</h3>
            <p className="muted mt-16">필요한 시공을 골라 견적함에 담아보세요.</p>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>
              서비스 둘러보기 →
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <Steps current={1} />
        <h1 className="h2">견적함</h1>
        <p className="lead mt-16">함께 시공할 항목을 모아 한 번에 요청하세요.</p>

        <div className="cart-grid mt-40">
          {/* 아이템 리스트 */}
          <div>
            {items.map((item, i) => (
              <div key={i} className="cart-line">
                <div style={{ width: 88, height: 88, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-deep)' }}>
                  {(() => {
                    const imgUrl = allItems.find((si) => si.code === item.serviceItemCode)?.imageUrl
                    return imgUrl ? (
                      <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null
                  })()}
                </div>
                <div>
                  <div className="cart-line-title">{item.serviceItemName}</div>
                  {item.productName ? (
                    <div className="cart-line-sub">
                      <span style={{ color: 'var(--orange-deep)', fontWeight: 700 }}>{item.productBrand}</span>
                      {item.productBrand && ' '}
                      <span style={{ fontWeight: 600 }}>{item.productName}</span>
                    </div>
                  ) : (
                    <div className="cart-line-sub">{item.serviceItemUnit}</div>
                  )}
                  <button className="btn sm ghost mt-8" onClick={() => remove(i)}>
                    제거
                  </button>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="cart-line-price">{fmtKRW(item.serviceItemPrice + item.productPrice)}</div>
                  {item.productPrice > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>
                      시공 {fmtKRW(item.serviceItemPrice)} + 자재 {fmtKRW(item.productPrice)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="mt-24">
              <button className="btn ghost" onClick={() => navigate('/services')}>
                + 서비스 더 담기
              </button>
            </div>
          </div>

          {/* 요약 사이드바 */}
          <aside className="summary">
            <h3 className="h3 mb-16">예상 견적</h3>
            <div className="summary-row">
              <span className="label">시공·자재 합계 ({items.length}건)</span>
              <span>{fmtKRW(itemsTotal)}</span>
            </div>
            <div className="summary-row">
              <span className="label">방문비</span>
              <span>{fmtKRW(visitFee)}</span>
            </div>
            <div className="summary-row big">
              <span>예상 총액</span>
              <span className="num">{fmtKRW(itemsTotal + visitFee)}</span>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              실제 금액은 현장 확인 후 확정됩니다. 결제는 시공 완료 후에 진행돼요.
            </p>
            <button className="btn primary lg mt-24 block" onClick={() => navigate('/request')}>
              견적 요청하기 →
            </button>
            <button className="btn ghost mt-8 block" onClick={clear}>
              견적함 비우기
            </button>
          </aside>
        </div>
      </div>
    </section>
  )
}
