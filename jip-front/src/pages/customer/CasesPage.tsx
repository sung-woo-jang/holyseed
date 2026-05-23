import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCases } from '@/queries/cases'

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

const ALL_TAGS = ['전체', '주방', '화장실', '필름']

export default function CasesPage() {
  const navigate = useNavigate()
  const [tag, setTag] = useState('전체')
  const { data: cases } = useCases(tag === '전체' ? undefined : tag)

  return (
    <section className="section">
      <div className="container">
        <h1 className="h2">시공사례</h1>
        <p className="lead mt-12">김장인이 다녀온 집들.</p>

        <div className="filter-row mt-40">
          {ALL_TAGS.map((t) => (
            <button key={t} className={`pill${tag === t ? ' on' : ''}`} onClick={() => setTag(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="case-grid mt-40">
          {cases?.map((c) => {
            const photo = c.photos?.find((p) => p.role === 'cover')?.fileUrl ?? casePhoto(c.color)
            return (
            <div key={c.id} className="case-card" onClick={() => navigate(`/case/${c.id}`)}>
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
          })}
        </div>
      </div>
    </section>
  )
}
