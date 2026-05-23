import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기', accepted: '수락됨', in_progress: '진행 중', done: '완료', cancelled: '취소됨',
}

interface DashboardData {
  pending: number
  inProgress: number
  monthlyRevenue: number
  recentRequests: {
    id: number; code: string; status: string;
    contactName: string; createdAt: string;
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
    <section className="section admin-page">
      <div className="container">
        <h1 className="h2">대시보드</h1>
        <p className="lead mt-8">안녕하세요, 김장인님.</p>

        <div className="admin-stat-grid mt-32">
          <div className="stat-card">
            <div className="stat-label">검토 대기</div>
            <div className="stat-val orange">{data?.pending ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">진행 중</div>
            <div className="stat-val blue">{data?.inProgress ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">이번달 매출</div>
            <div className="stat-val">{data ? fmtKRW(data.monthlyRevenue) : '—'}</div>
          </div>
        </div>

        {/* 최근 요청 */}
        <div className="mt-48">
          <div className="spread mb-16">
            <h2 className="h2">최근 요청</h2>
            <button className="btn ghost" onClick={() => navigate('/admin/requests')}>전체 보기</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>요청번호</th>
                  <th>고객명</th>
                  <th>서비스</th>
                  <th>상태</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentRequests.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/admin/requests/${r.code}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 700 }}>{r.code}</td>
                    <td>{r.contactName}</td>
                    <td>{r.items?.[0]?.nameSnapshot ?? '—'}</td>
                    <td><span className={`tag${r.status === 'done' ? ' green' : r.status === 'pending' ? ' orange' : ''}`}>{STATUS_LABEL[r.status]}</span></td>
                    <td className="muted" style={{ fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="admin-quick-menu mt-48">
          {[
            { label: '📋 견적 요청', path: '/admin/requests' },
            { label: '📅 일정 관리', path: '/admin/schedule' },
            { label: '🖼 시공사례', path: '/admin/cases' },
            { label: '📓 시공 일지', path: '/admin/jobs' },
          ].map((m) => (
            <button key={m.path} className="quick-menu-btn" onClick={() => navigate(m.path)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
