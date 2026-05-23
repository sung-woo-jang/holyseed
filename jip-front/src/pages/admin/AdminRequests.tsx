import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'

const STATUS_TABS = [
  { key: '', label: '전체' },
  { key: 'pending', label: '검토 대기' },
  { key: 'accepted', label: '수락됨' },
  { key: 'in_progress', label: '진행 중' },
  { key: 'done', label: '완료' },
  { key: 'cancelled', label: '취소됨' },
]

const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기', accepted: '수락됨', in_progress: '진행 중', done: '완료', cancelled: '취소됨',
}

interface RequestRow {
  id: number; code: string; status: string;
  contactName: string; contactPhone: string; createdAt: string;
  items: { nameSnapshot: string }[]
}

export default function AdminRequests() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [rows, setRows] = useState<RequestRow[]>([])

  useEffect(() => {
    api.post('/requests/admin/list', { status: status || undefined })
      .then((r) => setRows(r.data.data))
  }, [status])

  const handleTab = (key: string) => {
    setStatus(key)
    if (key) setSearchParams({ status: key })
    else setSearchParams({})
  }

  return (
    <section className="section admin-page">
      <div className="container">
        <h1 className="h2">견적 요청</h1>

        <div className="filter-row mt-24">
          {STATUS_TABS.map((t) => (
            <button key={t.key} className={`pill${status === t.key ? ' on' : ''}`} onClick={() => handleTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto', marginTop: 24 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>요청번호</th>
                <th>고객명</th>
                <th>전화번호</th>
                <th>서비스</th>
                <th>상태</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/admin/requests/${r.code}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700 }}>{r.code}</td>
                  <td>{r.contactName}</td>
                  <td>{r.contactPhone}</td>
                  <td>{r.items?.[0]?.nameSnapshot ?? '—'}{r.items?.length > 1 ? ` 외 ${r.items.length - 1}` : ''}</td>
                  <td><span className={`tag${r.status === 'done' ? ' green' : r.status === 'pending' ? ' orange' : ''}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td className="muted" style={{ fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty mt-32">요청이 없어요.</div>}
        </div>
      </div>
    </section>
  )
}
