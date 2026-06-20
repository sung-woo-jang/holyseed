import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/shared/api'
import AdminNavigation from '@/widgets/admin-nav/AdminNavigation'
import styles from './AdminLayout.module.css'

export default function AdminLayout() {
  const [email, setEmail] = useState<string>('')
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setChecked(true); return }
    api.post('/auth/me')
      .then((res) => {
        setEmail(res.data.data?.email ?? '')
        setAuthorized(true)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setChecked(true))
  }, [])

  if (!checked) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (!authorized) return <Navigate to="/login" replace />

  return (
    <div className={styles.shell}>
      {drawerOpen && <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />}

      <AdminNavigation
        userEmail={email}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <main className={styles.main}>
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="메뉴"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className={styles.topbarTitle}>Wedding <span className={styles.topbarAccent}>Archive</span></span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
