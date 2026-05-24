import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { JIcon, JPhoto, JStatusPill } from '@/components/common/JobsShared'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { Job } from '@/types'

function fmtKRW(n: number | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('ko-KR') + '원'
}

export default function AdminJobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!id) return
    api.post('/jobs/admin/list', {}).then((r) => {
      const found = r.data.data.find((j: Job) => j.id === id)
      setJob(found ?? null)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [id])

  const togglePublish = async () => {
    if (!job) return
    try {
      await api.post(`/jobs/admin/${id}/update`, { isPublished: !job.isPublished })
      showToast(job.isPublished ? '비공개로 전환됐어요' : '공개로 전환됐어요')
      setJob((prev) => (prev ? { ...prev, isPublished: !prev.isPublished } : prev))
    } catch {
      showToast('변경 실패', 'error')
    }
  }

  const copyUrl = () => {
    const url = `${window.location.origin}/jobs/${id}`
    navigator.clipboard.writeText(url)
    showToast('URL이 복사됐어요')
  }

  if (loading) return <div className="empty mt-40">로딩 중...</div>
  if (!job) return <div className="empty mt-40">일지를 찾을 수 없어요.</div>

  const beforePhotos = job.beforePhotos ?? []
  const afterPhotos = job.afterPhotos ?? []

  const KV_FIELDS: { label: string; value?: string | number | null }[] = [
    { label: '고객명', value: job.customerName },
    { label: '전화', value: job.phone },
    { label: '간이주소', value: job.addressShort },
    { label: '상세주소', value: job.addressFull },
    { label: '문의일', value: job.inquiryDate },
    { label: '시공일', value: job.workDate },
    { label: '제품명', value: job.productName },
    { label: '브랜드', value: job.brand },
    { label: '모델명', value: job.model },
  ]

  return (
    <>
      <div className="steps mb-16">
        <span className="link" onClick={() => navigate('/admin/jobs')}>
          시공 일지
        </span>
        <span className="sep">›</span>
        <b>{job.customerName ?? job.id}</b>
      </div>

      <div className="spread mb-20" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="jobs-detail-head" style={{ marginBottom: 0 }}>
          <h1>{job.productName ?? '일지'}</h1>
          <div className="meta">
            <JStatusPill status={job.status} />
            {job.customerName && (
              <>
                <span className="sep">·</span>
                <span>{job.customerName}</span>
              </>
            )}
            {job.addressShort && (
              <>
                <span className="sep">·</span>
                <span>{job.addressShort}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`btn ${job.isPublished ? 'ghost' : 'primary'}`} onClick={togglePublish}>
            {job.isPublished ? '비공개로' : '공개로 전환'}
          </button>
          <button
            className="btn ink"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate(`/admin/jobs/${id}/edit`)}
          >
            <JIcon.Edit s={14} /> 수정
          </button>
        </div>
      </div>

      {/* 사진 */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="jobs-hero">
          {beforePhotos.length > 0 && (
            <div className="group">
              <div className="head">
                <span className="tag">BEFORE</span>시공 전 ({beforePhotos.length}장)
              </div>
              <div
                className={`jobs-gallery ${beforePhotos.length === 1 ? 'one' : beforePhotos.length === 2 ? 'two' : ''}`}
              >
                {beforePhotos.map((p, i) => (
                  <div key={i} className="cell">
                    <JPhoto
                      fileUrl={p.fileUrl}
                      role="before"
                      label={p.label ?? undefined}
                      idx={i}
                      style={{ height: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {afterPhotos.length > 0 && (
            <div className="group after">
              <div className="head">
                <span className="tag">AFTER</span>시공 후 ({afterPhotos.length}장)
              </div>
              <div
                className={`jobs-gallery ${afterPhotos.length === 1 ? 'one' : afterPhotos.length === 2 ? 'two' : ''}`}
              >
                {afterPhotos.map((p, i) => (
                  <div key={i} className="cell">
                    <JPhoto
                      fileUrl={p.fileUrl}
                      role="after"
                      label={p.label ?? undefined}
                      idx={i}
                      style={{ height: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 요청사항 + 작업요약 */}
      {job.requestNote && <div className="jobs-request-note mt-20">{job.requestNote}</div>}
      {job.workSummary && (
        <div className="jobs-work-summary mt-16">
          {job.workSummary}
          <div className="sig">— 김장인</div>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="jobs-info mt-24">
        <h3>기본 정보</h3>
        <div className="jobs-kv">
          {KV_FIELDS.filter((f) => f.value).map((f) => (
            <>
              <div className="k">{f.label}</div>
              <div className="v">{f.value}</div>
            </>
          ))}
        </div>
      </div>

      {/* 내부 전용 */}
      <div className="jobs-internal">
        <h3>내부 전용</h3>
        <div className="grid-2">
          <div>
            <div className="lbl">시공비</div>
            <div className="num">{fmtKRW(job.sellingPrice)}</div>
          </div>
          <div>
            <div className="lbl">자재원가</div>
            <div className="num cost">{fmtKRW(job.costPrice)}</div>
          </div>
          {job.sellingPrice && job.costPrice && (
            <div>
              <div className="lbl">순이익</div>
              <div className="num profit">{fmtKRW(job.sellingPrice - job.costPrice)}</div>
            </div>
          )}
          <div>
            <div className="lbl">자재 구매처</div>
            <div>{job.materialSource ?? '—'}</div>
          </div>
          <div>
            <div className="lbl">입금</div>
            <div style={{ fontWeight: 700, color: job.paid ? '#10B981' : '#EF4444' }}>
              {job.paid ? `완료 (${job.paidDate ?? ''})` : '미입금'}
            </div>
          </div>
        </div>
        {job.internalMemo && (
          <div className="memo">
            <div className="lbl">내부 메모</div>
            {job.internalMemo}
          </div>
        )}
      </div>

      {/* 공유 바 */}
      {job.isPublished && (
        <div className="jobs-share">
          <div className="url">
            {window.location.origin}/jobs/{id}
          </div>
          <button
            type="button"
            className="btn sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={copyUrl}
          >
            <JIcon.Copy s={13} /> URL 복사
          </button>
        </div>
      )}
    </>
  )
}
