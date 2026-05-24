import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function MobileAppBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const parts = location.pathname.split('/').filter(Boolean)
  const top = parts[0] || 'home'
  const showBack = ['service', 'product', 'case', 'booking', 'request'].includes(top)
  const isBrand = top === 'home' || parts.length === 0

  const TITLES: Record<string, string> = {
    services: '서비스',
    cart: '견적함',
    request: '견적 요청',
    'request-done': '요청 완료',
    cases: '시공사례',
    about: '시공자 소개',
    bookings: '예약 확인',
    booking: '예약 상세',
    service: '서비스',
    product: '제품',
    case: '시공사례',
  }

  return (
    <header className={`mobile-appbar${scrolled ? 'shadow' : ''}`}>
      {showBack ? (
        <button className="back" onClick={() => navigate(-1)} aria-label="back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : (
        <div className="placeholder" />
      )}
      {isBrand ? (
        <div className="title" style={{ textAlign: 'left' }}>
          <span className="brand-inline">
            <span className="brand-mark">집</span>
            집수리
          </span>
        </div>
      ) : (
        <div className="title">{TITLES[top] || '집수리'}</div>
      )}
      <div className="placeholder" />
    </header>
  )
}
