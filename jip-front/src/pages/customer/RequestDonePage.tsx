import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart'

export default function RequestDonePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const clearCart = useCartStore((s) => s.clear)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <section className="section">
      <div className="container">
        <div className="empty">
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 className="h2">견적 요청이 완료됐어요</h2>
          <div className="mt-16" style={{ background: 'var(--gray)', borderRadius: 'var(--radius-md)', padding: '16px 24px', display: 'inline-block' }}>
            <span className="muted" style={{ fontSize: 13 }}>요청번호</span>
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>{code}</div>
          </div>
          <p className="lead mt-24">
            24시간 안에 김장인이 직접 연락드릴게요.<br />
            요청번호와 전화번호로 진행 상황을 확인할 수 있어요.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <button className="btn primary lg" onClick={() => navigate('/bookings')}>예약 확인하기</button>
            <button className="btn ghost lg" onClick={() => navigate('/')}>홈으로</button>
          </div>
        </div>
      </div>
    </section>
  )
}
