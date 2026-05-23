import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '@/queries/catalog'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import Illustration from '@/components/common/Illustration'
import type { Product } from '@/types'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useProduct(id ?? '')
  const addToCart = useCartStore((s) => s.add)
  const showToast = useToastStore((s) => s.show)

  if (isLoading) return <div className="container" style={{ paddingTop: 80 }}>로딩 중...</div>
  if (error || !data) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">제품을 찾을 수 없어요</h3>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>전체 서비스 →</button>
          </div>
        </div>
      </section>
    )
  }

  const product = data as Product & { productGroup?: { serviceItem?: { code: string; name: string; price: number; unit: string } } }
  const serviceItem = product.productGroup?.serviceItem

  if (!serviceItem) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">제품 정보를 불러올 수 없어요</h3>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>전체 서비스 →</button>
          </div>
        </div>
      </section>
    )
  }

  const addWithProduct = () => {
    addToCart({
      serviceItemCode: serviceItem.code,
      serviceItemName: serviceItem.name,
      serviceItemPrice: serviceItem.price,
      serviceItemUnit: serviceItem.unit ?? '',
      productCode: product.code,
      productName: product.name,
      productPrice: product.price,
      productBrand: product.brand,
    })
    showToast(`'${product.name}' 견적함에 담았어요`)
    navigate('/cart')
  }

  return (
    <section className="section">
      <div className="container">
        {/* breadcrumb */}
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/services')}>서비스</button>
          <span className="sep">›</span>
          <button className="link" onClick={() => navigate(`/service/${serviceItem.code}`)}>{serviceItem.name}</button>
          <span className="sep">›</span>
          <b>{product.brand} {product.name}</b>
        </div>

        <div className="product-detail-layout">
          {/* 갤러리 */}
          <div className="product-detail-gallery">
            <div className="product-detail-main-img">
              <Illustration kind={product.illustKind} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="product-detail-thumbs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="product-detail-thumb">
                  <Illustration kind={product.illustKind} style={{ width: '100%', height: '100%' }} />
                </div>
              ))}
            </div>
          </div>

          {/* 사이드 정보 */}
          <div className="product-detail-side">
            <div className="product-detail-brand">{product.brand}</div>
            <h1 className="h2">{product.name}</h1>
            <div className="product-detail-spec">{product.spec}</div>

            {product.colors?.length > 0 && (
              <div className="product-detail-colors mt-24">
                <div className="lbl mb-8">색상</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.colors.map((c) => (
                    <span key={c.id} className="tag outline">{c.label}</span>
                  ))}
                </div>
              </div>
            )}

            {product.features?.length > 0 && (
              <div className="product-detail-features mt-24">
                <div className="lbl mb-8">주요 특징</div>
                <ul className="feature-list">
                  {product.features.map((f) => (
                    <li key={f.id}>✓ {f.label}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="product-detail-price-row mt-32">
              <div>
                <div className="lbl">자재비</div>
                <div className="price-big">{fmtKRW(product.price)}</div>
              </div>
              <div>
                <div className="lbl">시공비</div>
                <div className="price-big">{fmtKRW(serviceItem.price)}</div>
              </div>
            </div>

            <button className="btn primary xl mt-32 w-full" onClick={addWithProduct}>
              견적함에 담기 →
            </button>
            <p className="muted mt-12" style={{ fontSize: 13 }}>
              자재비 + 시공비를 합산해 견적 요청됩니다.
            </p>
          </div>
        </div>

        {/* 제품 설명 */}
        {product.description && (
          <div className="product-desc-section mt-48">
            <h2 className="h2 mb-16">제품 소개</h2>
            <p className="lead">{product.description}</p>
          </div>
        )}
      </div>
    </section>
  )
}
