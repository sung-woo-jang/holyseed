import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Job, JobStatus } from '@/types'

const STATUS_TABS: { key: JobStatus | ''; label: string }[] = [
  { key: '', label: '전체' },
  { key: '문의접수', label: '문의접수' },
  { key: '시공대기', label: '시공대기' },
  { key: '시공완료', label: '시공완료' },
]

const STATUS_COLOR: Record<string, string> = {
  '문의접수': '#3B82F6', '시공대기': '#F59E0B', '시공완료': '#10B981',
}

export default function AdminJobsList() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<JobStatus | ''>('')
  const [search, setSearch] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    api.post('/jobs/admin/list', {
      status: status || undefined,
      search: search || undefined,
    }).then((r) => setJobs(r.data.data))
  }, [status, search])

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="spread mb-24">
          <h1 className="h2">시공 일지</h1>
          <button className="btn primary" onClick={() => navigate('/admin/jobs/new')}>+ 새 일지</button>
        </div>

        {/* 검색 */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="고객명, 주소, 제품, 브랜드 검색..."
          style={{ width: '100%', maxWidth: 400, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, marginBottom: 16 }}
        />

        {/* 상태 탭 */}
        <div className="filter-row mb-24">
          {STATUS_TABS.map((t) => (
            <button key={t.key} className={`pill${status === t.key ? ' on' : ''}`} onClick={() => setStatus(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 카드 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map((j) => (
            <div
              key={j.id}
              className="card"
              onClick={() => navigate(`/admin/jobs/${j.id}`)}
              style={{ cursor: 'pointer', padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{j.customerName ?? '—'}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {j.addressShort} · {j.productName}
                    {j.brand ? ` (${j.brand})` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!j.isPublished && <span className="tag" style={{ fontSize: 11 }}>비공개</span>}
                  {j.status && (
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: (STATUS_COLOR[j.status] ?? '#999') + '20',
                      color: STATUS_COLOR[j.status] ?? '#999',
                    }}>
                      {j.status}
                    </span>
                  )}
                </div>
              </div>
              {j.workDate && (
                <div className="muted mt-8" style={{ fontSize: 13 }}>시공일: {j.workDate}</div>
              )}
            </div>
          ))}
          {jobs.length === 0 && <div className="empty">일지가 없어요.</div>}
        </div>
      </div>
    </section>
  )
}
