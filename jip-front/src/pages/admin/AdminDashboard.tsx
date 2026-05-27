import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기',
  accepted: '수락됨',
  in_progress: '진행 중',
  done: '완료',
  cancelled: '취소됨',
}

interface DashboardData {
  pending: number
  inProgress: number
  monthlyRevenue: number
  recentRequests: {
    id: number
    code: string
    status: string
    contactName: string
    createdAt: string
    items: { nameSnapshot: string }[]
  }[]
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data.data))
  }, [])

  return (
    <>
      <div className="spread mb-24" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">DASHBOARD</div>
          <h1 className="h2 mt-8">오늘의 작업</h1>
        </div>
        <span className="mono muted" style={{ fontSize: 13 }}>
          {new Date().toLocaleDateString('ko-KR')}
        </span>
      </div>

      <div className="admin-grid">
        <div className="stat-card">
          <div className="lbl">검토 대기</div>
          <div className="num">{data?.pending ?? '—'}</div>
          <div className="delta">새 요청에 답해주세요</div>
        </div>
        <div className="stat-card">
          <div className="lbl">진행 중</div>
          <div className="num">{data?.inProgress ?? '—'}</div>
          <div className="delta" style={{ color: 'var(--orange)' }}>
            일정 잡힌 작업
          </div>
        </div>
        <div className="stat-card">
          <div className="lbl">이번 달 매출</div>
          <div className="num" style={{ fontSize: 26 }}>
            {data ? fmtKRW(data.monthlyRevenue) : '—'}
          </div>
          <div className="delta">입금 완료 기준</div>
        </div>
      </div>

      <h2 className="h3 mt-40 mb-16">최근 요청</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>요청번호</th>
              <th>고객명</th>
              <th>서비스</th>
              <th>상태</th>
              <th>일시</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.recentRequests.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.code}</td>
                <td>{r.contactName}</td>
                <td>{r.items?.[0]?.nameSnapshot ?? '—'}</td>
                <td>
                  <span className={`tag${r.status === 'done' ? ' green' : r.status === 'pending' ? ' orange' : ''}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td className="muted">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                  <button className="btn sm" onClick={() => navigate(`/admin/requests/${r.code}`)}>
                    상세
                  </button>
                </td>
              </tr>
            ))}
            {(!data || data.recentRequests.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}>
                  요청이 아직 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="spread mt-32" style={{ gap: 12 }}>
        <button className="btn ghost" onClick={() => navigate('/admin/requests')}>
          전체 요청 보기 →
        </button>
        <button className="btn ghost" onClick={() => navigate('/admin/jobs')}>
          시공 일지 →
        </button>
      </div>
    </>
  )
}
