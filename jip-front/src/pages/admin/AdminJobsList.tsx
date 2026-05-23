import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { JIcon, JPhoto, JStatusPill } from '@/components/common/JobsShared'
import type { Job } from '@/types'

function fmtDate(s?: string) {
  if (!s) return ''
  return s.slice(5, 10).replace('-', '/')
}

function fmtMoney(n?: number | null) {
  if (n == null) return ''
  return n.toLocaleString('ko-KR') + '원'
}

const STATUS_TABS = [
  { k: '', label: '전체' },
  { k: '문의접수', label: '문의접수' },
  { k: '시공대기', label: '시공대기' },
  { k: '시공완료', label: '시공완료' },
] as const

export default function AdminJobsList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('')
  const [q, setQ] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    api.post('/jobs/admin/list', {
      status: tab || undefined,
      search: q || undefined,
    }).then((r) => setJobs(r.data.data))
  }, [tab, q])

  const now = new Date()
  const monthSum = jobs
    .filter((j) => j.paid && j.paidDate && new Date(j.paidDate).getMonth() === now.getMonth() && new Date(j.paidDate).getFullYear() === now.getFullYear())
    .reduce((s, j) => s + (Number(j.sellingPrice) || 0), 0)

  const counts = {
    '': jobs.length,
    '문의접수': jobs.filter((j) => j.status === '문의접수').length,
    '시공대기': jobs.filter((j) => j.status === '시공대기').length,
    '시공완료': jobs.filter((j) => j.status === '시공완료').length,
  }

  return (
    <>
      <div className="jobs-list-head">
        <div>
          <div className="eyebrow">JOB JOURNAL</div>
          <h1 className="h2 mt-8">시공 일지</h1>
          <div className="jobs-month-sum">
            이번달 입금 합계 <b>{fmtMoney(monthSum) || '0원'}</b>
            <span style={{ marginLeft: 8, color: 'var(--ink-4)' }}>· 전체 {jobs.length}건</span>
          </div>
        </div>
        <button className="btn primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/admin/jobs/new')}>
          <JIcon.Plus s={16} /> 새 일지
        </button>
      </div>

      <div className="jobs-search">
        <span className="ico"><JIcon.Search /></span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="고객명·주소·제품 검색"
        />
      </div>

      <div className="jobs-tabs">
        {STATUS_TABS.map((t) => (
          <button key={t.k} className={tab === t.k ? 'on' : ''} onClick={() => setTab(t.k)}>
            {t.label} <span className="cnt">{counts[t.k]}</span>
          </button>
        ))}
      </div>

      <div className="jobs-list">
        {jobs.length === 0 && <div className="empty">조건에 맞는 일지가 없어요.</div>}
        {jobs.map((j) => {
          const thumb = j.afterPhotos?.[0] ?? j.beforePhotos?.[0]
          const thumbRole: 'before' | 'after' = j.afterPhotos?.[0] ? 'after' : 'before'
          return (
            <div key={j.id} className="jobs-card" onClick={() => navigate(`/admin/jobs/${j.id}`)}>
              <div className="thumb">
                <JPhoto fileUrl={thumb?.fileUrl} role={thumbRole} label={thumb?.label ?? undefined} />
              </div>
              <div className="body">
                <div className="row1">
                  <div className="ttl">
                    {j.productName || '(제품명 미입력)'}
                    {j.brand && <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}> · {j.brand}</span>}
                  </div>
                  <JStatusPill status={j.status} />
                  {!j.isPublished && <span className="jobs-pill draft">비공개</span>}
                </div>
                <div className="meta">
                  <span>{j.customerName}</span>
                  <span className="sep">·</span>
                  <span>{j.addressShort}</span>
                  <span className="sep">·</span>
                  <span>{j.workDate ? `시공 ${fmtDate(j.workDate)}` : j.inquiryDate ? `문의 ${fmtDate(j.inquiryDate)}` : ''}</span>
                </div>
                <div className="row3">
                  {j.sellingPrice ? (
                    <>
                      <span className="money">{fmtMoney(j.sellingPrice)}</span>
                      <span className="sep">·</span>
                      {j.paid ? <span className="paid">입금</span> : <span className="unpaid">미입금</span>}
                      <span className="sep">·</span>
                    </>
                  ) : null}
                  <span>{j.updatedAt ? new Date(j.updatedAt).toLocaleDateString('ko-KR') + ' 수정' : ''}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
