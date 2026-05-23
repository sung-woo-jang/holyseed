import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '@/queries/catalog'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import Illustration, { ItemIllust } from '@/components/common/Illustration'
import type { Product } from '@/types'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

type ProductFull = Product & {
  productGroup?: {
    id: number
    code: string
    label: string
    description?: string
    products?: Product[]
    serviceItem?: {
      code: string
      name: string
      price: number
      unit: string
      duration: string
      category?: { name: string; code: string; color: string }
    }
  }
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <span className="faq-icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, error } = useProduct(id ?? '')
  const cartItems = useCartStore((s) => s.items)
  const addToCart = useCartStore((s) => s.add)
  const removeFromCart = useCartStore((s) => s.remove)
  const showToast = useToastStore((s) => s.show)
  const [activePhoto, setActivePhoto] = useState(0)

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

  const product = data as ProductFull
  const serviceItem = product.productGroup?.serviceItem
  const group = product.productGroup
  const cat = serviceItem?.category

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

  const totalPrice = serviceItem.price + product.price
  const inCart = cartItems.some((c) => c.serviceItemCode === serviceItem.code && c.productCode === product.code)
  const otherInCartIdx = cartItems.findIndex((c) => c.serviceItemCode === serviceItem.code && c.productCode !== product.code)
  const otherInCart = otherInCartIdx !== -1

  const others = (group?.products ?? []).filter((p) => p.code !== product.code)

  const photos = [
    { label: '대표' },
    { label: '디테일' },
    { label: '시공 예시' },
    { label: '컬러' },
  ]

  const addWithProduct = () => {
    if (inCart) return
    if (otherInCart) removeFromCart(otherInCartIdx)
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
          <button className="link" onClick={() => navigate(`/service/${serviceItem.code}`)}>{serviceItem.name}</button>
          <span className="sep">›</span>
          <b>{product.brand} {product.name}</b>
        </div>

        {/* 제품 상세 레이아웃 */}
        <div className="product-detail">
          {/* 갤러리 */}
          <div className="product-gallery">
            <div className="product-hero">
              <Illustration kind={product.illustKind} imageUrl={product.imageUrl} style={{ width: '100%', height: '100%' }} />
              <div className="product-photo-label">{photos[activePhoto].label}</div>
            </div>
            <div className="product-thumbs">
              {photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-thumb${i === activePhoto ? ' on' : ''}`}
                  onClick={() => setActivePhoto(i)}
                >
                  <Illustration kind={product.illustKind} imageUrl={product.imageUrl} style={{ width: '100%', height: '100%' }} />
                </button>
              ))}
            </div>
          </div>

          {/* 오른쪽 정보 */}
          <div className="product-detail-side">
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cat && <span className="tag">{cat.name}</span>}
                <span className="tag">{serviceItem.name}</span>
                {group && <span className="tag">{group.label}</span>}
              </div>
              <div className="product-brand-big mt-16">{product.brand}</div>
              <h1 className="h2 mt-4">{product.name}</h1>
              <div className="product-spec-big mt-8">{product.spec}</div>
            </div>

            {product.description && <p className="lead">{product.description}</p>}

            {product.features?.length > 0 && (
              <div className="product-features">
                {product.features.map((f) => (
                  <div key={f.id} className="product-feature">
                    <span className="product-feature-dot" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            )}

            {product.colors?.length > 0 && (
              <div>
                <div className="field-label mb-8">선택 가능 색상</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.colors.map((c) => (
                    <span key={c.id} className="tag outline">{c.label}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 가격 요약 */}
            <div className="product-pricing">
              <div className="product-pricing-row">
                <span className="muted">시공비 · {serviceItem.name}</span>
                <span>{fmtKRW(serviceItem.price)}</span>
              </div>
              <div className="product-pricing-row">
                <span className="muted">자재비 · {product.name}</span>
                <span>{fmtKRW(product.price)}</span>
              </div>
              <div className="product-pricing-total">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="label">합계 (방문비 별도)</span>
                  <span className="val">{fmtKRW(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 쇼핑몰 스타일 스토어 페이지 */}
        <div className="store-page mt-64">
          {/* 1) 태그라인 */}
          <section className="store-block store-tagline">
            <div className="store-tagline-eyebrow">{product.brand}</div>
            <h2 className="store-tagline-text">
              {cat?.name === '주방' ? '매일 쓰는 주방, 작은 것부터 바꿔봐요.' :
               cat?.name === '욕실' ? '하루의 시작과 끝, 욕실이 달라집니다.' :
               cat?.name === '필름' ? '필름 한 장으로 집 분위기가 바뀝니다.' :
               cat?.name === '바닥' ? '발 끝의 감촉부터 다시.' :
               '집의 작은 디테일.'}
            </h2>
            <p className="store-tagline-sub">{product.description}</p>
          </section>

          {/* 2) 대표 이미지 */}
          <section className="store-block store-bigimg">
            <div className="store-bigimg-art">
              <Illustration kind={product.illustKind} imageUrl={product.imageUrl} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="store-bigimg-caption">
              <span className="mono">01</span>
              <span>{product.brand} {product.name} · {product.spec}</span>
            </div>
          </section>

          {/* 3) 세 가지 이유 */}
          {(product.features?.length ?? 0) > 0 && (
            <section className="store-block">
              <div className="store-eyebrow">왜 이 제품인가요</div>
              <h3 className="store-h2">세 가지 이유</h3>
              <div className="store-reasons">
                {product.features.slice(0, 3).map((f, i) => (
                  <div key={f.id} className="store-reason">
                    <div className="store-reason-num">0{i + 1}</div>
                    <div className="store-reason-title">{f.label}</div>
                    <div className="store-reason-desc">
                      {i === 0 ? '제품 본체부터 신경 썼어요. 오래 써도 변형이 적습니다.' :
                       i === 1 ? '매일 쓰는 곳이라 잔고장이 없어야 해요. 검증된 부품만 사용해요.' :
                                 '시공 후 6개월간 무상 점검. 자재 자체 보증도 별도로 받으실 수 있어요.'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4) 디테일 컷 */}
          <section className="store-block">
            <div className="store-eyebrow">DETAIL</div>
            <h3 className="store-h2">가까이서 본 모습</h3>
            <div className="store-detail-grid">
              {[
                { label: '정면', tag: '대표 컷' },
                { label: '측면', tag: '디테일' },
                { label: '연결부', tag: '시공 포인트' },
                { label: '마감', tag: '품질' },
              ].map((d, i) => (
                <div key={i} className="store-detail-card">
                  <div className="store-detail-art">
                    <Illustration kind={product.illustKind} imageUrl={product.imageUrl} style={{ width: '100%', height: '100%' }} />
                    <div className="store-detail-tag">{d.tag}</div>
                  </div>
                  <div className="store-detail-label">{d.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 5) BEFORE / AFTER */}
          <section className="store-block store-compare-block">
            <div className="store-eyebrow">BEFORE / AFTER</div>
            <h3 className="store-h2">시공 전후 비교</h3>
            <div className="store-compare">
              <div className="store-compare-side before">
                <div className="store-compare-tag">BEFORE</div>
                <div className="store-compare-art">
                  <Illustration kind="default" style={{ width: '100%', height: '100%' }} />
                </div>
                <div className="store-compare-caption">오래 써서 녹슬고 누수가 시작된 기존 제품</div>
              </div>
              <div className="store-compare-arrow">→</div>
              <div className="store-compare-side after">
                <div className="store-compare-tag">AFTER</div>
                <div className="store-compare-art">
                  <Illustration kind={product.illustKind} imageUrl={product.imageUrl} style={{ width: '100%', height: '100%' }} />
                </div>
                <div className="store-compare-caption">{product.brand} {product.name}으로 깔끔하게 교체</div>
              </div>
            </div>
          </section>

          {/* 6) 사양 */}
          <section className="store-block">
            <div className="store-eyebrow">SPECS</div>
            <h3 className="store-h2">제품 사양</h3>
            <div className="store-specs">
              <div className="store-spec-row"><span className="store-spec-key">브랜드</span><span className="store-spec-val">{product.brand}</span></div>
              <div className="store-spec-row"><span className="store-spec-key">제품명</span><span className="store-spec-val">{product.name}</span></div>
              {cat && <div className="store-spec-row"><span className="store-spec-key">분류</span><span className="store-spec-val">{cat.name} · {serviceItem.name}</span></div>}
              <div className="store-spec-row"><span className="store-spec-key">규격 / 마감</span><span className="store-spec-val">{product.spec}</span></div>
              {product.colors?.length > 0 && (
                <div className="store-spec-row"><span className="store-spec-key">색상</span><span className="store-spec-val">{product.colors.map((c) => c.label).join(', ')}</span></div>
              )}
              <div className="store-spec-row"><span className="store-spec-key">자재비</span><span className="store-spec-val">{fmtKRW(product.price)}</span></div>
              <div className="store-spec-row"><span className="store-spec-key">시공비</span><span className="store-spec-val">{fmtKRW(serviceItem.price)} · {serviceItem.duration}</span></div>
              <div className="store-spec-row"><span className="store-spec-key">방문비</span><span className="store-spec-val">20,000원 (별도)</span></div>
              <div className="store-spec-row total"><span className="store-spec-key">합계 (방문비 별도)</span><span className="store-spec-val">{fmtKRW(totalPrice)}</span></div>
            </div>
          </section>

          {/* 7) 신뢰 배지 */}
          <section className="store-block store-trust">
            <div className="store-trust-grid">
              <div className="store-trust-card">
                <div className="store-trust-ico">✓</div>
                <div className="store-trust-title">정품 자재</div>
                <div className="store-trust-desc">국산 브랜드 정식 유통 자재만 사용합니다.</div>
              </div>
              <div className="store-trust-card">
                <div className="store-trust-ico">⏱</div>
                <div className="store-trust-title">시공 후 6개월 보증</div>
                <div className="store-trust-desc">시공 관련 문제는 6개월 동안 무상 점검.</div>
              </div>
              <div className="store-trust-card">
                <div className="store-trust-ico">₩</div>
                <div className="store-trust-title">시공 후 결제</div>
                <div className="store-trust-desc">완전히 끝난 뒤에 정산하니까 안심하셔도 돼요.</div>
              </div>
            </div>
          </section>

          {/* 8) 후기 */}
          <section className="store-block">
            <div className="store-eyebrow">REVIEWS</div>
            <h3 className="store-h2">다녀온 집의 이야기</h3>
            <div className="store-reviews">
              {[
                { area: '서초구 반포동', name: '박○○ 고객', stars: 5, txt: '오래된 제품을 교체했는데 분위기가 확 바뀌었어요. 깔끔하게 시공해주셔서 만족합니다.' },
                { area: '강남구 역삼동', name: '이○○ 고객', stars: 5, txt: '아침에 연락드렸는데 그날 저녁에 바로 와주셨어요. 마무리도 깨끗하게 해주셨습니다.' },
                { area: '마포구 망원동', name: '김○○ 고객', stars: 4, txt: '가격도 합리적이고 친절하셨어요. 다음에 다른 시공도 부탁드리려구요.' },
              ].map((r, i) => (
                <div key={i} className="store-review">
                  <div className="store-review-stars">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className={j < r.stars ? 'on' : ''}>★</span>
                    ))}
                  </div>
                  <p className="store-review-txt">{r.txt}</p>
                  <div className="store-review-meta">{r.name} · {r.area}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 상세 설명 섹션 */}
        <div className="product-sections">
          {/* 왜 이 제품인가요 */}
          {(product.features?.length ?? 0) > 0 && (
            <div className="product-section">
              <div>
                <div className="product-section-tag">상세 설명</div>
                <h2 className="h2 mt-12">왜 이 제품인가요?</h2>
                <p className="lead mt-16">{product.description}</p>
              </div>
              <div className="product-section-grid mt-32">
                {product.features.map((f, i) => (
                  <div key={f.id} className="product-info-card">
                    <div className="product-info-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="product-info-title">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시공 정보 */}
          <div className="product-section" style={{ background: 'var(--bg-deep)', borderRadius: 'var(--radius-xl)', padding: '40px' }}>
            <div>
              <div className="product-section-tag">시공 정보</div>
              <h2 className="h2 mt-12">이렇게 시공돼요</h2>
            </div>
            <div>
              <div className="install-steps mt-32">
                {[
                  { n: '01', t: '방문 확인', d: '현장에 도착해서 기존 제품과 배관 상태를 확인합니다.' },
                  { n: '02', t: '기존 제품 철거', d: '물을 잠그고 기존 제품을 안전하게 분리합니다.' },
                  { n: '03', t: '신제품 설치', d: `선택하신 ${product.name}을(를) 정확히 설치합니다.` },
                  { n: '04', t: '누수·작동 확인', d: '물을 다시 열고 누수 점검과 작동 테스트까지 끝냅니다.' },
                ].map((s) => (
                  <div key={s.n} className="install-step">
                    <div className="install-step-num">{s.n}</div>
                    <div>
                      <div className="install-step-title">{s.t}</div>
                      <div className="install-step-desc">{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="install-meta mt-32">
                <div><span className="lbl">예상 소요시간</span><span className="val">{serviceItem.duration}</span></div>
                <div><span className="lbl">A/S 기간</span><span className="val">제품 보증 + 시공 6개월</span></div>
                <div><span className="lbl">결제</span><span className="val">시공 완료 후 정산</span></div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="product-section">
            <div>
              <div className="product-section-tag">자주 묻는 질문</div>
              <h2 className="h2 mt-12">FAQ</h2>
            </div>
            <div className="faq-list mt-32">
              {[
                { q: '제품 색상은 어디서 확인하나요?', a: '시공 당일 색상 샘플을 가져가서 함께 보고 결정합니다. 사진과 실물이 다를 수 있어서 꼭 현장에서 확인해요.' },
                { q: 'A/S는 어떻게 받나요?', a: '제품 자체 보증과 별도로, 시공 후 6개월 동안은 시공 관련 무료 A/S를 제공합니다. 그 이후엔 출장비만 받고 점검 드려요.' },
                { q: '결제는 언제 하나요?', a: '시공이 완료된 뒤에 정산합니다. 방문비 2만원은 예약 시 선결제하지만, 시공으로 이어지면 총액에 포함돼서 차감돼요.' },
                { q: '이 제품 말고 다른 제품도 가능한가요?', a: '네, 카탈로그에 없는 제품도 시공 가능합니다. 견적 요청 시 메모에 원하시는 제품을 적어주세요.' },
              ].map((f, i) => <FAQItem key={i} {...f} />)}
            </div>
          </div>
        </div>

        {/* 같은 그룹 다른 제품 */}
        {others.length > 0 && (
          <div className="mt-64">
            <h2 className="h3 mb-24">{group?.label}의 다른 제품</h2>
            <div className="product-grid">
              {others.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="product-card"
                  onClick={() => navigate(`/product/${p.code}`)}
                >
                  <div className="product-illust">
                    <ItemIllust code={p.illustKind} imageUrl={p.imageUrl} />
                  </div>
                  <div className="product-body">
                    <div className="product-brand">{p.brand}</div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-spec">{p.spec}</div>
                  </div>
                  <div className="product-foot">
                    <span className="product-label">자재비</span>
                    <span className="product-price">{fmtKRW(p.price)}</span>
                  </div>
                  <div className="product-go">→</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="sticky-cta-bar">
        <div className="container sticky-cta-inner">
          <div className="sticky-cta-info">
            <div className="sticky-cta-summary">{product.brand} {product.name} · 시공 + 자재 합계</div>
            <div className="sticky-cta-price">
              <span className="muted" style={{ fontSize: 12 }}>시공 {fmtKRW(serviceItem.price)} + 자재 {fmtKRW(product.price)}</span>
              <div className="sticky-cta-total">{fmtKRW(totalPrice)}</div>
            </div>
          </div>
          <div className="sticky-cta-actions">
            <button
              className={`btn lg ${inCart ? 'ghost' : 'primary'}`}
              disabled={inCart}
              onClick={addWithProduct}
            >
              {inCart ? '✓ 견적함에 담겼어요' : otherInCart ? '이 제품으로 바꿔서 담기' : '견적함에 담기'}
            </button>
            <button className="btn ink lg" onClick={() => navigate('/cart')}>견적함 →</button>
          </div>
        </div>
      </div>
    </section>
  )
}
