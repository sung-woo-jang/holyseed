import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useServiceItem, useCategories, useServiceItems } from '@/queries/catalog'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import { ItemIllust } from '@/components/common/Illustration'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading, error } = useServiceItem(id ?? '')
  const { data: categories } = useCategories()
  const cartItems = useCartStore((s) => s.items)
  const addToCart = useCartStore((s) => s.add)
  const showToast = useToastStore((s) => s.show)

  const cat = categories?.find((c) => c.id === item?.categoryId)
  const { data: catItems } = useServiceItems(cat?.code)
  const related = catItems?.filter((i) => i.code !== item?.code).slice(0, 3) ?? []

  const hasProducts = (item?.productGroups?.length ?? 0) > 0
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const activeGroup = item?.productGroups?.find((g) => g.id === (activeGroupId ?? item?.productGroups?.[0]?.id))
    ?? item?.productGroups?.[0]

  const inCart = cartItems.some((c) => c.serviceItemCode === item?.code)

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

  const addSimple = () => {
    if (inCart) return
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
          {cat && (
            <>
              <span className="sep">›</span>
              <button className="link" onClick={() => navigate(`/services?cat=${cat.code}`)}>{cat.name}</button>
            </>
          )}
          <span className="sep">›</span>
          <b>{item.name}</b>
        </div>

        {/* 인트로 */}
        <div className="svc-intro">
          <div className="svc-intro-illust">
            <ItemIllust code={item.code} />
          </div>
          <div className="svc-intro-body">
            {cat && <span className="tag orange">{cat.name}</span>}
            <h1 className="h2 mt-16">{item.name}</h1>
            <p className="lead mt-12">{item.description}</p>
            <div className="svc-intro-meta">
              <div><span className="lbl">시공비</span><span className="val">{fmtKRW(item.price)}</span></div>
              <div><span className="lbl">소요시간</span><span className="val">{item.duration}</span></div>
              <div><span className="lbl">방문비</span><span className="val">20,000원 별도</span></div>
              <div><span className="lbl">결제</span><span className="val">시공 후 정산</span></div>
            </div>
          </div>
        </div>

        {/* 제품 라인업 */}
        {hasProducts ? (
          <div className="svc-products mt-48">
            <div className="svc-products-head">
              <div>
                <h2 className="h2">제품 라인업</h2>
                <p className="lead mt-12">
                  원하는 제품을 골라주세요.<br />
                  카드를 누르면 자세한 설명을 볼 수 있어요.
                </p>
              </div>
            </div>

            {/* 그룹 탭 */}
            {item.productGroups.length > 1 && (
              <div className="seg-tabs">
                {item.productGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`seg-tab${(activeGroupId ?? item.productGroups[0].id) === g.id ? ' on' : ''}`}
                    onClick={() => setActiveGroupId(g.id)}
                  >
                    <div className="seg-tab-label">{g.label}</div>
                    <div className="seg-tab-count">{g.products.length}개</div>
                  </button>
                ))}
              </div>
            )}

            {activeGroup?.description && (
              <p className="muted mt-16" style={{ fontSize: 13, marginBottom: 0 }}>{activeGroup.description}</p>
            )}

            <div className="product-grid mt-16">
              {activeGroup?.products.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  className="product-card"
                  onClick={() => navigate(`/product/${prod.code}`)}
                >
                  <div className="product-illust">
                    <ItemIllust code={prod.illustKind} />
                  </div>
                  <div className="product-body">
                    <div className="product-brand">{prod.brand}</div>
                    <div className="product-name">{prod.name}</div>
                    <div className="product-spec">{prod.spec}</div>
                  </div>
                  <div className="product-foot">
                    <span className="product-label">자재비</span>
                    <span className="product-price">{fmtKRW(prod.price)}</span>
                  </div>
                  <div className="product-go">→</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-48">
            <div className="card card-pad">
              <h3 className="h3">자재 협의 후 시공</h3>
              <p className="muted mt-12" style={{ margin: '12px 0 16px', lineHeight: 1.6 }}>
                이 시공은 별도 제품 선택 없이 진행돼요. 현장에서 직접 보고 함께 협의해서 결정합니다.
              </p>
              <button
                className={`btn lg ${inCart ? 'ghost' : 'primary'}`}
                disabled={inCart}
                onClick={addSimple}
              >
                {inCart ? '✓ 견적함에 담겼어요' : '견적함에 담기'}
              </button>
            </div>
          </div>
        )}

        {/* 관련 서비스 */}
        {related.length > 0 && (
          <div className="mt-64">
            <h2 className="h3 mb-24">같은 카테고리의 다른 시공</h2>
            <div className="svc-grid">
              {related.map((rel) => (
                <div key={rel.id} className="svc-card" onClick={() => navigate(`/service/${rel.code}`)}>
                  <div style={{ height: 120 }}>
                    <ItemIllust code={rel.code} />
                  </div>
                  <div className="svc-card-body">
                    <div className="svc-card-title">{rel.name}</div>
                    <div className="svc-card-desc">{rel.description}</div>
                    <div className="svc-card-price"><b>{fmtKRW(rel.price)}</b>{rel.unit ? ` · ${rel.unit}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
