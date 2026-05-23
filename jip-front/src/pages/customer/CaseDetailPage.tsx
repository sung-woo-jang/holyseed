import { useParams, useNavigate } from 'react-router-dom'
import { useCase } from '@/queries/cases'
import Illustration from '@/components/common/Illustration'

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c, isLoading, error } = useCase(id ?? '')

  if (isLoading) return <div className="container" style={{ paddingTop: 80 }}>로딩 중...</div>
  if (error || !c) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">시공사례를 찾을 수 없어요</h3>
            <button className="btn primary mt-24" onClick={() => navigate('/cases')}>전체 보기</button>
          </div>
        </div>
      </section>
    )
  }

  const kind = c.color === 'warm' ? 'kitchen' : c.color === 'cool' ? 'bath' : 'film'

  return (
    <section className="section">
      <div className="container">
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/cases')}>시공사례</button>
          <span className="sep">›</span>
          <b>{c.title}</b>
        </div>

        {/* 커버 */}
        <div style={{ height: 320, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 32 }}>
          <Illustration kind={kind} style={{ width: '100%', height: '100%' }} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {c.tags?.map((t) => (
            <span key={t.id} className="tag">{t.tag}</span>
          ))}
        </div>

        <h1 className="h2">{c.title}</h1>
        <div className="case-card-meta mt-8">{c.area} · {c.hours}시간 · {c.dateText}</div>

        {c.intro && <p className="lead mt-24">{c.intro}</p>}
        {c.story && <p className="mt-24" style={{ lineHeight: 1.8 }}>{c.story}</p>}

        {/* Before / After 사진 */}
        {(c.photos?.length ?? 0) > 0 && (
          <div className="mt-48">
            <h2 className="h2 mb-24">시공 전·후</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {c.photos?.filter((p) => p.role === 'before').map((p) => (
                <div key={p.id}>
                  <div className="tag mb-8">Before</div>
                  <div style={{ height: 200, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {p.fileUrl
                      ? <img src={p.fileUrl} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Illustration kind={kind} />}
                  </div>
                  {p.label && <div className="muted mt-8" style={{ fontSize: 13 }}>{p.label}</div>}
                </div>
              ))}
              {c.photos?.filter((p) => p.role === 'after').map((p) => (
                <div key={p.id}>
                  <div className="tag green mb-8">After</div>
                  <div style={{ height: 200, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {p.fileUrl
                      ? <img src={p.fileUrl} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Illustration kind={kind} />}
                  </div>
                  {p.label && <div className="muted mt-8" style={{ fontSize: 13 }}>{p.label}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 비슷한 시공 받기 CTA */}
        <div className="about-cta mt-48" style={{ padding: '40px', background: 'var(--gray)', borderRadius: 'var(--radius-xl)' }}>
          <div>
            <h2 className="h2">비슷한 시공, 받아보실래요?</h2>
            <p className="lead mt-12">사진과 메모 하나로 견적을 요청해보세요.</p>
            <button className="btn primary lg mt-24" onClick={() => navigate('/cart')}>
              견적 요청하기 →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
