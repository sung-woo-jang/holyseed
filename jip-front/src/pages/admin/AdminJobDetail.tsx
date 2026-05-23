import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { Job } from '@/types'

function fmtKRW(n: number | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('ko-KR') + '원'
}

const FIELD_LABELS: Record<string, string> = {
  customerName: '고객명', phone: '전화번호', addressFull: '상세주소', addressShort: '간이주소',
  inquiryDate: '문의일', workDate: '시공일', status: '진행상황', productName: '제품명',
  brand: '브랜드', model: '모델명', requestNote: '요청사항', workSummary: '작업요약',
  sellingPrice: '시공비', costPrice: '자재원가', materialSource: '자재 구매처',
  paid: '입금 여부', paidDate: '입금일', internalMemo: '내부 메모',
}

const INTERNAL_KEYS = new Set(['sellingPrice', 'costPrice', 'materialSource', 'paid', 'paidDate', 'internalMemo'])

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!id) return
    api.post('/jobs/admin/list', {}).then((r) => {
      // admin list returns full data; find by id
      const found = r.data.data.find((j: Job) => j.id === id)
      setJob(found ?? null)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [id])

  const togglePublish = async () => {
    if (!job) return
    try {
      await api.post(`/jobs/admin/${id}/update`, { isPublished: !job.isPublished })
      showToast(job.isPublished ? '비공개로 전환됐어요' : '공개로 전환됐어요')
      setJob((prev) => prev ? { ...prev, isPublished: !prev.isPublished } : prev)
    } catch {
      showToast('변경 실패', 'error')
    }
  }

  const copyUrl = () => {
    const url = `${window.location.origin}/jobs/${id}`
    navigator.clipboard.writeText(url)
    showToast('URL이 복사됐어요')
  }

  if (loading) return <div className="container" style={{ paddingTop: 80 }}>로딩 중...</div>
  if (!job) return <div className="container" style={{ paddingTop: 80 }}>일지를 찾을 수 없어요.</div>

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/admin/jobs')}>시공 일지</button>
          <span className="sep">›</span>
          <b>{job.customerName}</b>
        </div>

        <div className="spread mb-24" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="h2">{job.productName ?? '일지'}</h1>
            <div className="muted mt-4">{job.id}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className={`btn ${job.isPublished ? 'ghost' : 'primary'}`} onClick={togglePublish}>
              {job.isPublished ? '비공개로' : '공개로 전환'}
            </button>
            {job.isPublished && (
              <button className="btn ghost" onClick={copyUrl}>URL 복사</button>
            )}
            <button className="btn ink" onClick={() => navigate(`/admin/jobs/${id}/edit`)}>수정</button>
          </div>
        </div>

        {/* 공개 필드 */}
        <div className="form-card mb-24">
          <h3 className="h3 mb-16">공개 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {Object.keys(FIELD_LABELS)
              .filter((k) => !INTERNAL_KEYS.has(k))
              .filter((k) => !['requestNote', 'workSummary'].includes(k))
              .map((k) => {
                const val = (job as Record<string, unknown>)[k]
                const isPublic = job.publicFields?.includes(
                  k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
                )
                return (
                  <div key={k}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="lbl" style={{ fontSize: 11 }}>{FIELD_LABELS[k]}</span>
                      {isPublic && <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700 }}>공개</span>}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                      {val == null ? '—' : String(val)}
                    </div>
                  </div>
                )
              })}
          </div>
          {job.requestNote && (
            <div className="mt-24">
              <div className="lbl mb-4">요청사항</div>
              <p style={{ lineHeight: 1.8 }}>{job.requestNote}</p>
            </div>
          )}
          {job.workSummary && (
            <div className="mt-16">
              <div className="lbl mb-4">작업요약</div>
              <p style={{ lineHeight: 1.8 }}>{job.workSummary}</p>
            </div>
          )}
        </div>

        {/* 내부 전용 */}
        <div className="form-card mb-24" style={{ border: '2px solid var(--border)', borderLeft: '4px solid var(--ink)' }}>
          <h3 className="h3 mb-16">🔒 내부 전용</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <div className="lbl" style={{ fontSize: 11 }}>시공비</div>
              <div style={{ fontWeight: 700 }}>{fmtKRW(job.sellingPrice)}</div>
            </div>
            <div>
              <div className="lbl" style={{ fontSize: 11 }}>자재원가</div>
              <div style={{ fontWeight: 700 }}>{fmtKRW(job.costPrice)}</div>
            </div>
            <div>
              <div className="lbl" style={{ fontSize: 11 }}>자재 구매처</div>
              <div>{job.materialSource ?? '—'}</div>
            </div>
            <div>
              <div className="lbl" style={{ fontSize: 11 }}>입금</div>
              <div style={{ fontWeight: 700, color: job.paid ? '#10B981' : '#EF4444' }}>
                {job.paid ? `완료 (${job.paidDate})` : '미입금'}
              </div>
            </div>
          </div>
          {job.internalMemo && (
            <div className="mt-16">
              <div className="lbl mb-4">내부 메모</div>
              <p style={{ lineHeight: 1.8, fontSize: 14 }}>{job.internalMemo}</p>
            </div>
          )}
        </div>

        {/* 사진 */}
        {((job.beforePhotos?.length ?? 0) > 0 || (job.afterPhotos?.length ?? 0) > 0) && (
          <div className="form-card">
            <h3 className="h3 mb-16">사진</h3>
            {(job.beforePhotos?.length ?? 0) > 0 && (
              <div className="mb-16">
                <div className="lbl mb-8">시공 전</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {job.beforePhotos?.map((p, i) => (
                    <div key={i}>
                      <div style={{ width: 120, height: 90, borderRadius: 8, background: 'var(--gray)', overflow: 'hidden' }}>
                        {p.fileUrl && <img src={p.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      {p.label && <div className="muted mt-4" style={{ fontSize: 12, maxWidth: 120 }}>{p.label}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(job.afterPhotos?.length ?? 0) > 0 && (
              <div>
                <div className="lbl mb-8">시공 후</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {job.afterPhotos?.map((p, i) => (
                    <div key={i}>
                      <div style={{ width: 120, height: 90, borderRadius: 8, background: 'var(--gray)', overflow: 'hidden' }}>
                        {p.fileUrl && <img src={p.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      {p.label && <div className="muted mt-4" style={{ fontSize: 12, maxWidth: 120 }}>{p.label}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
