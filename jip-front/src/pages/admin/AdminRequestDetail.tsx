import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { QuoteRequest } from '@/types'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

const STATUS_ACTIONS = [
  { key: 'pending', label: '검토 대기', next: 'accepted', action: '수락하기' },
  { key: 'accepted', label: '수락됨', next: 'in_progress', action: '진행 시작' },
  { key: 'in_progress', label: '진행 중', next: 'done', action: '완료 처리' },
]

export default function AdminRequestDetail() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [req, setReq] = useState<QuoteRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!code) return
    api.get(`/requests/${code}`)
      .then((r) => setReq(r.data.data))
      .catch(() => navigate('/admin/requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [code])

  const changeStatus = async (status: string) => {
    try {
      await api.post(`/requests/${code}/status`, { status })
      showToast('상태가 변경됐어요')
      load()
    } catch {
      showToast('상태 변경 실패', 'error')
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 80 }}>로딩 중...</div>
  if (!req) return null

  const action = STATUS_ACTIONS.find((a) => a.key === req.status)

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/admin/requests')}>견적 요청</button>
          <span className="sep">›</span>
          <b>{req.code}</b>
        </div>

        <div className="admin-detail-layout">
          {/* 메인 */}
          <div>
            <div className="form-card mb-24">
              <h3 className="h3 mb-16">요청 내용</h3>
              {req.items?.map((i) => (
                <div key={i.id} className="cart-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="cart-item-body">
                    <div style={{ fontWeight: 600 }}>{i.nameSnapshot}</div>
                    {i.productSnapshot && <div className="muted" style={{ fontSize: 13 }}>{JSON.stringify(i.productSnapshot)}</div>}
                  </div>
                  <div className="cart-item-price">{fmtKRW(i.priceSnapshot)}</div>
                </div>
              ))}
              {req.memo && (
                <div className="mt-16">
                  <div className="lbl mb-4">메모</div>
                  <p style={{ lineHeight: 1.8 }}>{req.memo}</p>
                </div>
              )}
            </div>
          </div>

          {/* 사이드 */}
          <div>
            <div className="form-card mb-16">
              <h3 className="h3 mb-16">고객 정보</h3>
              <div className="summary-row"><span>이름</span><span>{req.contactName}</span></div>
              <div className="summary-row">
                <span>전화</span>
                <a href={`tel:${req.contactPhone}`} style={{ fontWeight: 700, color: 'var(--orange)' }}>{req.contactPhone}</a>
              </div>
              <div className="summary-row"><span>주소</span><span>{req.contactAddress}</span></div>
              {req.prefDate && <div className="summary-row"><span>희망일</span><span>{req.prefDate} {req.prefTimeSlot}</span></div>}
            </div>

            <div className="form-card">
              <h3 className="h3 mb-16">상태 변경</h3>
              <div className="mb-16">
                <span className={`tag${req.status === 'done' ? ' green' : req.status === 'pending' ? ' orange' : ''}`}>
                  현재: {req.status}
                </span>
              </div>
              {action && (
                <button className="btn primary w-full" onClick={() => changeStatus(action.next)}>
                  {action.action}
                </button>
              )}
              {req.status !== 'cancelled' && req.status !== 'done' && (
                <button className="btn ghost w-full mt-8" onClick={() => changeStatus('cancelled')}>
                  취소 처리
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
