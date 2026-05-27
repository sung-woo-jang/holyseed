import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

function fmtKRW(n: number | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('ko-KR') + '원'
}

const STATUS_TABS = [
  { k: '', label: '전체' },
  { k: 'pending', label: '검토 중' },
  { k: 'accepted', label: '일정 확정' },
  { k: 'in_progress', label: '시공 중' },
  { k: 'done', label: '완료' },
  { k: 'cancelled', label: '취소' },
] as const

const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기',
  accepted: '수락됨',
  in_progress: '진행 중',
  done: '완료',
  cancelled: '취소됨',
}

interface RequestRow {
  id: number
  code: string
  status: string
  contactName: string
  contactPhone: string
  createdAt: string
  prefDate?: string
  itemsTotal?: number
  visitFee?: number
  items: { nameSnapshot: string }[]
}

export default function AdminRequests() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [rows, setRows] = useState<RequestRow[]>([])

  useEffect(() => {
    api.post('/requests/admin/list', { status: filter || undefined }).then((r) => setRows(r.data.data))
  }, [filter])

  return (
    <>
      <div className="eyebrow">REQUESTS</div>
      <h1 className="h2 mt-8 mb-24">견적 요청</h1>

      <div className="filter-row mb-24">
        {STATUS_TABS.map((t) => (
          <button key={t.k} className={`pill${filter === t.k ? ' on' : ''}`} onClick={() => setFilter(t.k)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>요청번호</th>
              <th>고객</th>
              <th>시공 내역</th>
              <th>희망일</th>
              <th>금액</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.code}</td>
                <td>
                  {r.contactName}
                  <div className="mono muted" style={{ fontSize: 11 }}>
                    {r.contactPhone}
                  </div>
                </td>
                <td>{r.items?.map((i) => i.nameSnapshot).join(', ') ?? '—'}</td>
                <td>{r.prefDate ?? '—'}</td>
                <td className="mono">{fmtKRW((r.itemsTotal ?? 0) + (r.visitFee ?? 0))}</td>
                <td>
                  <span className="tag">{STATUS_LABEL[r.status] ?? r.status}</span>
                </td>
                <td>
                  <button className="btn sm" onClick={() => navigate(`/admin/requests/${r.code}`)}>
                    상세
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}>
                  요청이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
