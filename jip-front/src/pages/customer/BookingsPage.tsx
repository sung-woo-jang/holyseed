import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { QuoteRequest } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기',
  accepted: '수락됨',
  in_progress: '진행 중',
  done: '완료',
  cancelled: '취소됨',
}

export default function BookingsPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [phone, setPhone] = useState('')
  const [results, setResults] = useState<QuoteRequest[] | null>(null)
  const [loading, setLoading] = useState(false)

  const lookup = async () => {
    if (!phone.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/requests/lookup', { phone })
      setResults(res.data.data)
    } catch {
      showToast('조회 실패. 전화번호를 확인해주세요.', 'error')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="h2">예약 확인</h1>
        <p className="lead mt-12">전화번호로 내 견적 요청을 찾아보세요.</p>

        <div className="form-card mt-40" style={{ maxWidth: 480 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 16,
              }}
              onKeyDown={(e) => e.key === 'Enter' && lookup()}
            />
            <button className="btn primary" onClick={lookup} disabled={loading}>
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
        </div>

        {results !== null && (
          <div className="mt-40">
            {results.length === 0 ? (
              <div className="empty">
                <p className="muted">해당 전화번호로 등록된 요청이 없어요.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="card"
                    onClick={() => navigate(`/booking/${r.code}`)}
                    style={{ cursor: 'pointer', padding: 24 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.code}</div>
                        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                          {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                      <span
                        className={`tag${r.status === 'done' ? 'green' : r.status === 'cancelled' ? '' : 'orange'}`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                    <div className="mt-12">
                      {r.items?.slice(0, 2).map((i) => (
                        <div key={i.id} className="muted" style={{ fontSize: 14 }}>
                          • {i.nameSnapshot}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
