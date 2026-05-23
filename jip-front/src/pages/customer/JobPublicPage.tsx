import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useJob } from '@/queries/jobs'
import Illustration from '@/components/common/Illustration'

const STATUS_COLOR: Record<string, string> = {
  '문의접수': '#3B82F6', '시공대기': '#F59E0B', '시공완료': '#10B981',
}

function PhotoGrid({ photos }: { photos: { role: string; label: string; fileUrl: string | null }[] }) {
  if (!photos || photos.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {photos.map((p, i) => (
        <div key={i}>
          <div style={{ height: 160, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--gray)' }}>
            {p.fileUrl
              ? <img src={p.fileUrl} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Illustration kind="default" />}
          </div>
          {p.label && <div className="muted mt-6" style={{ fontSize: 12 }}>{p.label}</div>}
        </div>
      ))}
    </div>
  )
}

export default function JobPublicPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: job, isLoading, error } = useJob(id ?? '')

  if (isLoading) return <div className="container" style={{ paddingTop: 80 }}>로딩 중...</div>

  if (error || !job) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <section className="section">
          <div className="container">
            <div className="empty">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h3 className="h3">일지를 찾을 수 없어요</h3>
              <p className="muted mt-16">비공개이거나 존재하지 않는 링크예요.</p>
              <button className="btn ghost mt-24" onClick={() => navigate('/')}>홈으로</button>
            </div>
          </div>
        </section>
      </>
    )
  }

  const statusColor = job.status ? STATUS_COLOR[job.status] : '#999'

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{job.productName ?? '시공 일지'} — 집수리</title>
      </Helmet>
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>

          {/* 헤더 */}
          <div className="form-card mb-32">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                {job.productName && <div style={{ fontSize: 22, fontWeight: 700 }}>{job.productName}</div>}
                {job.brand && <div className="muted mt-4">{job.brand}{job.model ? ` / ${job.model}` : ''}</div>}
              </div>
              {job.status && (
                <span style={{
                  display: 'inline-block', padding: '6px 14px', borderRadius: 20,
                  background: statusColor + '20', color: statusColor,
                  fontWeight: 700, fontSize: 13,
                }}>
                  {job.status}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 20 }}>
              {job.customerName && (
                <div><div className="lbl" style={{ fontSize: 11 }}>고객</div><div style={{ fontWeight: 600 }}>{job.customerName}</div></div>
              )}
              {job.addressShort && (
                <div><div className="lbl" style={{ fontSize: 11 }}>지역</div><div style={{ fontWeight: 600 }}>{job.addressShort}</div></div>
              )}
              {job.workDate && (
                <div><div className="lbl" style={{ fontSize: 11 }}>시공일</div><div style={{ fontWeight: 600 }}>{job.workDate}</div></div>
              )}
            </div>
          </div>

          {/* 요청사항 */}
          {job.requestNote && (
            <div className="form-card mb-24">
              <h3 className="h3 mb-12">요청사항</h3>
              <p style={{ lineHeight: 1.8, fontSize: 15 }}>{job.requestNote}</p>
            </div>
          )}

          {/* 작업 요약 */}
          {job.workSummary && (
            <div className="form-card mb-24">
              <h3 className="h3 mb-12">작업 요약</h3>
              <p style={{ lineHeight: 1.8, fontSize: 15 }}>{job.workSummary}</p>
            </div>
          )}

          {/* Before 사진 */}
          {(job.beforePhotos?.length ?? 0) > 0 && (
            <div className="form-card mb-24">
              <h3 className="h3 mb-16">시공 전</h3>
              <PhotoGrid photos={job.beforePhotos!} />
            </div>
          )}

          {/* After 사진 */}
          {(job.afterPhotos?.length ?? 0) > 0 && (
            <div className="form-card mb-24">
              <h3 className="h3 mb-16">시공 후</h3>
              <PhotoGrid photos={job.afterPhotos!} />
            </div>
          )}

          <p className="muted mt-32" style={{ fontSize: 12, textAlign: 'center' }}>
            집수리 시공일지 · 공유 전용 페이지
          </p>
        </div>
      </section>
    </>
  )
}
