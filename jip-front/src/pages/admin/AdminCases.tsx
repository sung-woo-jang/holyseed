import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { Case } from '@/types'


export default function AdminCases() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api
      .post('/cases/admin/list', {})
      .then((r) => setCases(r.data.data))
      .catch(() => showToast('목록을 불러오지 못했어요', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const handlePublish = async (c: Case) => {
    try {
      await api.post(`/cases/admin/${c.id}/publish`, { isPublished: !c.isPublished })
      showToast(c.isPublished ? '비공개로 변경됐어요' : '공개로 변경됐어요')
      load()
    } catch {
      showToast('변경 실패', 'error')
    }
  }

  const handleDelete = async (c: Case) => {
    if (!confirm(`"${c.title}" 을 삭제할까요? 되돌릴 수 없어요.`)) return
    try {
      await api.post(`/cases/admin/${c.id}/delete`, {})
      showToast('삭제됐어요')
      load()
    } catch {
      showToast('삭제 실패', 'error')
    }
  }

  const published = cases.filter((c) => c.isPublished).length

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow">CASES</div>
          <h1 className="h2 mt-8">시공사례 관리</h1>
          <p className="lead" style={{ marginTop: 4 }}>
            전체 {cases.length}건 · 공개 {published}건 · 비공개 {cases.length - published}건
          </p>
        </div>
        <button className="btn primary" onClick={() => navigate('/admin/cases/new')}>
          + 새 사례 추가
        </button>
      </div>

      {loading && <div className="empty">불러오는 중...</div>}
      {!loading && cases.length === 0 && <div className="empty">시공사례가 없어요.</div>}

      <div className="case-grid">
        {cases.map((c) => (
          <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 180, overflow: 'hidden', position: 'relative', background: 'var(--bg-deep)' }}>
              {c.photos?.find((p) => p.role === 'cover')?.fileUrl && (
                <img src={c.photos.find((p) => p.role === 'cover')!.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {!c.isPublished && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}
                >
                  비공개
                </div>
              )}
            </div>
            <div className="card-pad">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {c.tags?.slice(0, 3).map((t) => (
                  <span key={t.id} className="tag" style={{ fontSize: 11, padding: '3px 8px' }}>
                    {t.tag}
                  </span>
                ))}
              </div>
              <div className="case-card-title" style={{ marginBottom: 4 }}>
                {c.title}
              </div>
              <div className="case-card-meta" style={{ fontSize: 12 }}>
                {c.area}
                {c.area && c.hours ? ' · ' : ''}
                {c.hours ? `${c.hours}시간` : ''}
                {c.dateText ? ` · ${c.dateText}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn sm ghost" onClick={() => navigate(`/admin/cases/${c.id}`)}>
                  편집
                </button>
                <button className="btn sm ghost" onClick={() => handlePublish(c)}>
                  {c.isPublished ? '숨기기' : '공개'}
                </button>
                <button
                  className="btn sm ghost"
                  style={{ color: 'var(--red, #ef4444)', marginLeft: 'auto' }}
                  onClick={() => handleDelete(c)}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
