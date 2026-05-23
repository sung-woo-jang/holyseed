import { useCases } from '@/queries/cases'
import Illustration from '@/components/common/Illustration'

export default function AdminCases() {
  const { data: cases } = useCases()

  return (
    <>
      <div className="eyebrow">CASES</div>
      <h1 className="h2 mt-8 mb-8">시공사례 관리</h1>
      <p className="lead mb-24">고객 사이트에 노출되는 시공사례를 관리합니다.</p>

      <div className="case-grid">
        {cases?.map((c) => {
          const kind = c.color === 'warm' ? 'kitchen' : c.color === 'cool' ? 'bath' : 'film'
          return (
            <div key={c.id} className="card">
              <div style={{ height: 160, overflow: 'hidden' }}>
                <Illustration kind={kind} style={{ width: '100%', height: '100%' }} />
              </div>
              <div className="card-pad">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {c.tags?.slice(0, 2).map((t) => (
                    <span key={t.id} className="tag" style={{ fontSize: 11, padding: '3px 8px' }}>{t.tag}</span>
                  ))}
                  {!c.isPublished && <span className="tag" style={{ fontSize: 11, padding: '3px 8px', background: 'var(--border)' }}>비공개</span>}
                </div>
                <div className="case-card-title">{c.title}</div>
                <div className="case-card-meta mono" style={{ marginTop: 8, fontSize: 12 }}>{c.area} · {c.hours}시간</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn sm ghost">편집</button>
                  <button className="btn sm ghost">숨기기</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {(!cases || cases.length === 0) && <div className="empty mt-32">시공사례가 없어요.</div>}
    </>
  )
}
