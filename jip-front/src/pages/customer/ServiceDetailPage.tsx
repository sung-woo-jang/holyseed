import { useParams, useNavigate } from 'react-router-dom'
import { useServiceItem } from '@/queries/catalog'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import { ItemIllust } from '@/components/common/Illustration'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading, error } = useServiceItem(id ?? '')
  const addToCart = useCartStore((s) => s.add)
  const showToast = useToastStore((s) => s.show)

  if (isLoading) return <div className="container" style={{ paddingTop: 80 }}>로딩 중...</div>
  if (error || !item) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">서비스를 찾을 수 없어요</h3>
            <p className="muted mt-16">링크를 다시 확인하시거나 전체 서비스에서 골라보세요.</p>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>전체 서비스 →</button>
          </div>
        </div>
      </section>
    )
  }

  const hasProducts = item.productGroups && item.productGroups.length > 0

  const addSimple = () => {
    addToCart({
      serviceItemCode: item.code,
      serviceItemName: item.name,
      serviceItemPrice: item.price,
      serviceItemUnit: item.unit ?? '',
      productCode: null,
      productName: null,
      productPrice: 0,
      productBrand: null,
    })
    showToast(`'${item.name}' 견적함에 담았어요`)
    navigate('/cart')
  }

  return (
    <section className="section service-detail-page">
      <div className="container">
        {/* breadcrumb */}
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/services')}>서비스</button>
          <span className="sep">›</span>
          <b>{item.name}</b>
        </div>

        {/* 인트로 */}
        <div className="svc-intro">
          <div className="svc-intro-illust">
            <ItemIllust code={item.code} />
          </div>
          <div className="svc-intro-body">
            <h1 className="h2 mt-16">{item.name}</h1>
            <p className="lead mt-12">{item.description}</p>
            <div className="svc-intro-meta">
              <div><span className="lbl">시공비</span><span className="val">{fmtKRW(item.price)}</span></div>
              <div><span className="lbl">소요시간</span><span className="val">{item.duration}</span></div>
              <div><span className="lbl">단위</span><span className="val">{item.unit}</span></div>
              <div><span className="lbl">결제</span><span className="val">시공 후 정산</span></div>
            </div>
            {!hasProducts && (
              <button className="btn primary lg mt-32" onClick={addSimple}>
                견적함에 담기 →
              </button>
            )}
          </div>
        </div>

        {/* 제품 라인업 */}
        {hasProducts && (
          <div className="svc-products mt-48">
            <div className="svc-products-head">
              <div>
                <h2 className="h2">제품 라인업</h2>
                <p className="lead mt-12">원하는 제품을 골라 견적함에 담으세요.</p>
              </div>
            </div>

            {item.productGroups.map((group) => (
              <div key={group.id} className="product-group mt-40">
                <div className="product-group-head">
                  <h3 className="h3">{group.label}</h3>
                  {group.description && <p className="muted">{group.description}</p>}
                </div>
                <div className="product-grid">
                  {group.products.map((prod) => (
                    <div key={prod.id} className="product-card" onClick={() => navigate(`/product/${prod.code}`)}>
                      <div style={{ height: 120 }}>
                        <ItemIllust code={prod.illustKind} />
                      </div>
                      <div className="product-card-body">
                        <div className="product-card-brand">{prod.brand}</div>
                        <div className="product-card-name">{prod.name}</div>
                        <div className="product-card-spec">{prod.spec}</div>
                        <div className="product-card-price">{fmtKRW(prod.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
