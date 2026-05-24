import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { QuoteRequest } from '@/types'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const STATUS_STEPS = [
  { key: 'pending', label: '검토 대기' },
  { key: 'accepted', label: '수락됨' },
  { key: 'in_progress', label: '진행 중' },
  { key: 'done', label: '완료' },
]

export default function BookingDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [req, setReq] = useState<QuoteRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!code) return
    api
      .get(`/requests/${code}`)
      .then((r) => setReq(r.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [code])

  if (loading)
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        로딩 중...
      </div>
    )
  if (error || !req) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">요청을 찾을 수 없어요</h3>
            <button className="btn primary mt-24" onClick={() => navigate('/bookings')}>
              예약 확인으로
            </button>
          </div>
        </div>
      </section>
    )
  }

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === req.status)
  const isCancelled = req.status === 'cancelled'

  return (
    <section className="section">
      <div className="container">
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/bookings')}>
            예약 확인
          </button>
          <span className="sep">›</span>
          <b>{req.code}</b>
        </div>

        {/* 상태 타임라인 */}
        {!isCancelled && (
          <div className="form-card mb-32">
            <h3 className="h3 mb-24">진행 상황</h3>
            <div style={{ display: 'flex', gap: 0 }}>
              {STATUS_STEPS.map((s, i) => (
                <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      margin: '0 auto',
                      background: i <= currentStep ? 'var(--orange)' : 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: i <= currentStep ? '#fff' : 'var(--ink-4)',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        height: 2,
                        background: i < currentStep ? 'var(--orange)' : 'var(--border)',
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 8,
                      color: i <= currentStep ? 'var(--ink)' : 'var(--ink-4)',
                      fontWeight: i === currentStep ? 700 : 400,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {isCancelled && (
          <div className="tag mb-32" style={{ display: 'inline-block' }}>
            취소됨
          </div>
        )}

        {/* 요청 내용 */}
        <div className="form-card mb-24">
          <h3 className="h3 mb-16">요청 내용</h3>
          {req.items?.map((i) => (
            <div
              key={i.id}
              className="cart-item"
              style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div className="cart-item-body">
                <div style={{ fontWeight: 600 }}>{i.nameSnapshot}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {i.unitSnapshot}
                </div>
              </div>
              <div className="cart-item-price">{fmtKRW(i.priceSnapshot)}</div>
            </div>
          ))}
          {req.memo && (
            <p className="muted mt-16" style={{ fontSize: 14 }}>
              {req.memo}
            </p>
          )}
        </div>

        {/* 연락처 */}
        <div className="form-card mb-24">
          <h3 className="h3 mb-16">연락처</h3>
          <div className="muted" style={{ fontSize: 14 }}>
            {req.contactName} · {req.contactPhone}
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            {req.contactAddress}
          </div>
          {req.prefDate && (
            <div className="muted mt-8" style={{ fontSize: 14 }}>
              희망 일정: {req.prefDate} {req.prefTimeSlot}
            </div>
          )}
        </div>

        <button className="btn ghost" onClick={() => navigate('/bookings')}>
          ← 목록으로
        </button>
      </div>
    </section>
  )
}
