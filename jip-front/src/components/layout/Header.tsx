import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const cartCount = useCartStore((s) => s.items.length)
  const { isAdmin, logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  if (isAdminRoute) {
    return (
      <header className={`topbar shadow admin`}>
        <div className="container topbar-inner">
          <Link to="/admin" className="brand">
            <div className="brand-mark" style={{ background: 'var(--ink)' }}>집</div>
            <span>집수리 <span style={{ color: 'var(--orange)', fontSize: 12, marginLeft: 6, fontWeight: 700 }}>ADMIN</span></span>
          </Link>
          <nav className="nav">
            <Link to="/">고객 사이트로</Link>
            {isAdmin && (
              <button onClick={() => { logout(); navigate('/admin/login') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14 }}>
                로그아웃
              </button>
            )}
          </nav>
        </div>
      </header>
    )
  }

  const route = location.pathname.split('/')[1] || 'home'

  return (
    <header className={`topbar${scrolled ? ' shadow' : ''}`}>
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          <div className="brand-mark">집</div>
          <span>집수리</span>
        </Link>
        <nav className={`nav${menuOpen ? ' open' : ''}`}>
          <Link className={route === 'services' || route === 'service' ? 'on' : ''} to="/services">서비스</Link>
          <Link className={route === 'cases' || route === 'case' ? 'on' : ''} to="/cases">시공사례</Link>
          <Link className={route === 'about' ? 'on' : ''} to="/about">시공자 소개</Link>
          <Link className={route === 'bookings' || route === 'booking' ? 'on' : ''} to="/bookings">예약 확인</Link>
          <Link className={route === 'cart' ? 'on' : ''} to="/cart">
            견적함{cartCount > 0 && <span className="count">{cartCount}</span>}
          </Link>
          <Link className="admin-link" to="/admin">관리자</Link>
        </nav>
        <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>
    </header>
  )
}
