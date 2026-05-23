import { useNavigate } from 'react-router-dom'
import Illustration from '@/components/common/Illustration'

const TECH_INFO = {
  name: '김장인',
  years: 12,
  reviews: 127,
  jobs: 348,
  rating: 4.9,
  area: '서울 전 지역 · 경기 일부',
  intro: '주방·화장실·필름·마루까지, 12년 경력의 1인 시공자입니다. 견적은 무료, 시공은 정직하게.',
  phone: '010-1234-5678',
  hours: '평일 9시–19시',
}

const PHILOSOPHIES = [
  { icon: '🔧', title: '처음부터 끝까지 직접', desc: '외주 없이 혼자 다 합니다. 그래서 책임도 혼자 집니다. 작업하는 동안 중간에 사람이 바뀌지 않아요.' },
  { icon: '💬', title: '견적은 솔직하게', desc: '불필요한 추가비용 없이, 처음 안내한 금액으로 진행합니다. 현장에서 바뀌는 일은 꼭 미리 말씀드려요.' },
  { icon: '🕐', title: '약속 시간은 지킵니다', desc: '예약 시간 30분 전에 연락드리고, 늦을 땐 미리 알립니다. 시간은 서로 존중하는 것이라 생각해요.' },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <section className="section">
      <div className="container">

        {/* 소개 섹션 */}
        <div className="about-cta">
          <div>
            <div className="eyebrow">ABOUT</div>
            <h1 className="h1 mt-16">안녕하세요,<br />{TECH_INFO.name}입니다.</h1>
            <p className="lead mt-24">{TECH_INFO.intro}</p>
            <div className="hero-meta mt-32">
              <div className="stat"><div className="num">{TECH_INFO.years}년</div><div className="lbl">경력</div></div>
              <div className="stat"><div className="num">{TECH_INFO.jobs}+</div><div className="lbl">시공 건수</div></div>
              <div className="stat"><div className="num">★ {TECH_INFO.rating}</div><div className="lbl">평점</div></div>
            </div>
            <div className="mt-24" style={{ fontSize: 14, color: 'var(--ink-3)' }}>
              <div>📍 {TECH_INFO.area}</div>
              <div className="mt-8">⏰ {TECH_INFO.hours}</div>
              <div className="mt-8">📞 {TECH_INFO.phone}</div>
            </div>
          </div>
          <div className="about-art">
            <Illustration kind="person" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* 작업 철학 */}
        <div className="mt-80">
          <div className="eyebrow">PHILOSOPHY</div>
          <h2 className="h2 mt-16">작업 철학</h2>
          <div className="how-grid mt-40">
            {PHILOSOPHIES.map((p) => (
              <div key={p.title} className="how-card bg-gray">
                <div style={{ fontSize: 32 }}>{p.icon}</div>
                <h3 className="h3 mt-16">{p.title}</h3>
                <p className="how-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-80 center">
          <h2 className="h2">지금 견적 문의해보세요</h2>
          <p className="lead mt-12">사진 한 장, 메모 한 줄로 충분해요.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <button className="btn primary xl" onClick={() => navigate('/services')}>서비스 보기</button>
            <button className="btn ghost xl" onClick={() => navigate('/cases')}>시공사례 보기</button>
          </div>
        </div>

      </div>
    </section>
  )
}
