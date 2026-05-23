import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

const VISIT_FEE = 20000

export default function CartPage() {
  const navigate = useNavigate()
  const { items, remove } = useCartStore()

  const serviceTotal = items.reduce((s, i) => s + i.serviceItemPrice, 0)
  const productTotal = items.reduce((s, i) => s + i.productPrice, 0)
  const total = serviceTotal + productTotal + VISIT_FEE

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
            <h3 className="h3">견적함이 비어있어요</h3>
            <p className="muted mt-16">서비스를 골라 담아보세요.</p>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>서비스 둘러보기 →</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="h2">견적함</h1>
        <p className="lead mt-12">담은 서비스를 확인하고 견적을 요청하세요.</p>

        <div className="cart-layout mt-40">
          {/* 아이템 리스트 */}
          <div className="cart-items">
            {items.map((item, i) => (
              <div key={i} className="cart-item">
                <div className="cart-item-body">
                  <div className="cart-item-name">{item.serviceItemName}</div>
                  {item.productName && (
                    <div className="cart-item-product">{item.productBrand} {item.productName}</div>
                  )}
                  <div className="cart-item-unit">{item.serviceItemUnit}</div>
                </div>
                <div className="cart-item-price">
                  <div>{fmtKRW(item.serviceItemPrice)}</div>
                  {item.productPrice > 0 && (
                    <div className="muted" style={{ fontSize: 13 }}>+ 자재 {fmtKRW(item.productPrice)}</div>
                  )}
                </div>
                <button className="cart-item-remove" onClick={() => remove(i)} aria-label="삭제">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 요약 사이드바 */}
          <div className="cart-summary">
            <h3 className="h3 mb-24">견적 요약</h3>
            <div className="summary-row">
              <span>시공비 합계</span>
              <span>{fmtKRW(serviceTotal)}</span>
            </div>
            {productTotal > 0 && (
              <div className="summary-row">
                <span>자재비 합계</span>
                <span>{fmtKRW(productTotal)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>방문비</span>
              <span>{fmtKRW(VISIT_FEE)}</span>
            </div>
            <div className="summary-total">
              <span>예상 총액</span>
              <span>{fmtKRW(total)}</span>
            </div>
            <button className="btn primary xl mt-24 w-full" onClick={() => navigate('/request')}>
              견적 요청하기 →
            </button>
            <p className="muted mt-12" style={{ fontSize: 13, textAlign: 'center' }}>
              실제 금액은 방문 후 협의합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
