import { useNavigate } from 'react-router-dom'
import { useCategories, useFeaturedItems } from '@/queries/catalog'
import { useRecentCases } from '@/queries/cases'
import { ItemIllust, CatIllust } from '@/components/common/Illustration'
import type { Case } from '@/types'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

// 카테고리/케이스 color 기반 사진 매핑 (메인사진 + 카탈로그 아이템 사진)
const PHOTO = {
  bath:    'https://kr.object.ncloudstorage.com/living-craft/jip/cases/1779548942946_cc0gbn.webp',
  film:    'https://kr.object.ncloudstorage.com/living-craft/jip/cases/1779548943309_yggm25.webp',
  kitchen: 'https://kr.object.ncloudstorage.com/living-craft/jip/cases/1779548943517_khkjrn.webp',
} as const

function casePhoto(color: string) {
  if (color === 'warm') return PHOTO.kitchen
  if (color === 'cool') return PHOTO.bath
  return PHOTO.film
}

function CaseCard({ c }: { c: Case }) {
  const navigate = useNavigate()
  const photo = c.photos?.find((p) => p.role === 'cover')?.fileUrl ?? casePhoto(c.color)
  return (
    <div className="case-card" onClick={() => navigate(`/case/${c.id}`)}>
      <div style={{ overflow: 'hidden' }}>
        <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div className="case-card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {c.tags?.slice(0, 2).map((t) => (
            <span key={t.id} className="tag" style={{ fontSize: 11, padding: '3px 8px' }}>{t.tag}</span>
          ))}
        </div>
        <div className="case-card-title">{c.title}</div>
        <div className="case-card-meta">{c.area} · {c.hours}시간 · {c.dateText}</div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { data: featuredItems } = useFeaturedItems()
  const { data: recentCases } = useRecentCases()

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">12년 경력 · 1인 시공자</div>
            <h1 className="h1 mt-16">
              집의 작은 불편,<br />
              그날 안에 끝냅니다.
            </h1>
            <p className="lead mt-24">
              수전 하나, 싱크대 하나도 같은 마음으로.<br />
              사진과 메모만 보내면 김장인이 직접 견적을 드려요.
            </p>
            <div className="hero-cta">
              <button className="btn primary xl" onClick={() => navigate('/services')}>
                서비스 둘러보기 <span className="arrow">→</span>
              </button>
              <button className="btn ghost xl" onClick={() => navigate('/cases')}>
                시공사례 보기
              </button>
            </div>
            <div className="hero-meta">
              <div className="stat"><div className="num">12년</div><div className="lbl">경력</div></div>
              <div className="stat"><div className="num">348+</div><div className="lbl">시공 건수</div></div>
              <div className="stat"><div className="num">★ 4.9</div><div className="lbl">평점</div></div>
            </div>
          </div>
          <div className="hero-art" style={{ overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
            <img src={PHOTO.bath} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="hero-art-badge">오늘 견적 가능</div>
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="section">
        <div className="container">
          <div className="spread mb-40" style={{ alignItems: 'end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 className="h2">어디를 손볼까요?</h2>
              <p className="lead mt-12">필요한 시공을 골라 견적함에 담아보세요.</p>
            </div>
            <button className="btn ghost" onClick={() => navigate('/services')}>전체 서비스 →</button>
          </div>
          <div className="cat-grid">
            {categories?.map((c) => (
              <div key={c.id} className="cat-card" onClick={() => navigate(`/services?cat=${c.code}`)}>
                <div style={{ overflow: 'hidden' }}>
                  <CatIllust code={c.code} imageUrl={c.imageUrl ?? PHOTO[c.code as keyof typeof PHOTO]} />
                </div>
                <div className="cat-card-body">
                  <div className="cat-card-title">{c.name}</div>
                  <div className="cat-card-sub">{c.intro}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 자주 찾는 시공 */}
      {featuredItems && featuredItems.length > 0 && (
        <section className="section bg-gray" style={{ borderRadius: 'var(--radius-xl)', margin: '0 16px' }}>
          <div className="container">
            <div className="spread mb-32" style={{ alignItems: 'end', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 className="h2">자주 찾는 시공</h2>
                <p className="lead mt-12">사람들이 이번 달에 많이 신청한 서비스예요.</p>
              </div>
            </div>
            <div className="popular-list">
              {featuredItems.map((item, i) => (
                <div key={item.id} className="popular-item" onClick={() => navigate(`/service/${item.code}`)}>
                  <div className="popular-rank">{i + 1}</div>
                  <div className="popular-illust">
                    <ItemIllust code={item.code} imageUrl={item.imageUrl} />
                  </div>
                  <div className="popular-body">
                    <div className="popular-title">{item.name}</div>
                    <div className="popular-desc">{item.description}</div>
                  </div>
                  <div className="popular-price-col">
                    <div className="popular-price-label">시공비</div>
                    <div className="popular-price">{fmtKRW(item.price)}</div>
                  </div>
                  <div className="popular-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div className="center" style={{ maxWidth: 640, margin: '0 auto 48px' }}>
            <div className="eyebrow">HOW IT WORKS</div>
            <h2 className="h2 mt-16">견적부터 시공까지, 3단계</h2>
            <p className="lead mt-12" style={{ margin: '12px auto 0' }}>
              회원가입도, 미리 결제도 없습니다.<br />시공이 끝난 다음에 정산해요.
            </p>
          </div>
          <div className="how-grid">
            {[
              { n: '01', t: '서비스 담기', d: '필요한 시공을 견적함에 담아요.\n사진·메모도 함께 보낼 수 있어요.', bg: 'bg-warm', dot: '#FF6B35' },
              { n: '02', t: '견적 요청', d: '전화·주소만 남기면 끝.\n24시간 안에 김장인이 직접 연락드려요.', bg: 'bg-cool', dot: '#3B82F6' },
              { n: '03', t: '방문·시공', d: '협의된 날짜에 깔끔하게 마무리.\n시공 후에 결제합니다.', bg: 'bg-mint', dot: '#10B981' },
            ].map((s) => (
              <div key={s.n} className={`how-card ${s.bg}`}>
                <div className="how-num" style={{ color: s.dot }}>{s.n}</div>
                <h3 className="h3 mt-16">{s.t}</h3>
                <p className="how-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최근 시공사례 */}
      <section className="section">
        <div className="container">
          <div className="spread mb-32" style={{ alignItems: 'end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 className="h2">최근 시공사례</h2>
              <p className="lead mt-12">김장인이 다녀온 집들.</p>
            </div>
            <button className="btn ghost" onClick={() => navigate('/cases')}>전체 보기 →</button>
          </div>
          <div className="case-grid">
            {recentCases?.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      {/* About CTA */}
      <section className="section">
        <div className="container">
          <div className="about-cta">
            <div>
              <div className="eyebrow">ABOUT</div>
              <h2 className="h2 mt-16">한 사람이<br />처음부터 끝까지.</h2>
              <p className="lead mt-16">
                견적·시공·마무리까지 모두 김장인이 직접.<br />
                중간에 사람이 바뀌지 않아요.
              </p>
              <div className="mt-32">
                <button className="btn ink lg" onClick={() => navigate('/about')}>
                  시공자 더 알아보기 →
                </button>
              </div>
            </div>
            <div className="about-art" style={{ overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
              <img src={PHOTO.kitchen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
