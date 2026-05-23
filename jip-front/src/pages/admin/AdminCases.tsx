import { useCases } from '@/queries/cases'
import Illustration from '@/components/common/Illustration'

export default function AdminCases() {
  const { data: cases } = useCases()

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="spread mb-32">
          <h1 className="h2">시공사례</h1>
        </div>

        <div className="case-grid">
          {cases?.map((c) => {
            const kind = c.color === 'warm' ? 'kitchen' : c.color === 'cool' ? 'bath' : 'film'
            return (
              <div key={c.id} className="case-card">
                <div style={{ height: 160, overflow: 'hidden' }}>
                  <Illustration kind={kind} style={{ width: '100%', height: '100%' }} />
                </div>
                <div className="case-card-body">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {c.tags?.slice(0, 2).map((t) => (
                      <span key={t.id} className="tag" style={{ fontSize: 11, padding: '3px 8px' }}>{t.tag}</span>
                    ))}
                    {!c.isPublished && <span className="tag" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--border)' }}>비공개</span>}
                  </div>
                  <div className="case-card-title">{c.title}</div>
                  <div className="case-card-meta">{c.area} · {c.hours}시간</div>
                </div>
              </div>
            )
          })}
        </div>

        {(!cases || cases.length === 0) && <div className="empty mt-32">시공사례가 없어요.</div>}
      </div>
    </section>
  )
}
