import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { TOKEN_KEY } from '@/shared/api'
import styles from './AdminNavigation.module.css'

interface AdminNavigationProps {
  userEmail: string
}

export default function AdminNavigation({ userEmail }: AdminNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { href: '/admin/dashboard', label: '대시보드' },
    { href: '/admin/media', label: '미디어 관리' },
    { href: '/admin/content-rows', label: '콘텐츠 Row 관리' },
    { href: '/admin/attendance', label: '참석 응답 관리' },
    { href: '/admin/settings', label: '설정' },
  ]

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    navigate('/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        <div className={styles.leftSection}>
          <button className={styles.menuButton} onClick={() => setIsMenuOpen((v) => !v)} aria-label="메뉴 열기" aria-expanded={isMenuOpen}>
            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link to="/admin/dashboard" className={styles.logo}>Wedding Archive</Link>

          <div className={styles.desktopMenu}>
            {menuItems.map((item) => (
              <Link key={item.href} to={item.href} className={`${styles.menuLink} ${pathname === item.href ? styles.activeLink : ''}`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.userSection}>
          <span className={styles.userEmail}>{userEmail}</span>
          <button type="button" onClick={handleLogout} className={styles.logoutButton}>로그아웃</button>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}><h2 className={styles.drawerTitle}>메뉴</h2></div>
            <div className={styles.drawerMenu}>
              {menuItems.map((item) => (
                <Link key={item.href} to={item.href} className={`${styles.drawerMenuItem} ${pathname === item.href ? styles.drawerMenuItemActive : ''}`} onClick={() => setIsMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className={styles.drawerFooter}>
              <span className={styles.drawerUserEmail}>{userEmail}</span>
              <button type="button" onClick={handleLogout} className={styles.drawerLogoutButton}>로그아웃</button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
