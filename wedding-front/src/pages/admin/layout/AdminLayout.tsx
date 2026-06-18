import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/shared/api'
import AdminNavigation from '@/widgets/admin-nav/AdminNavigation'
import styles from './AdminLayout.module.css'

export default function AdminLayout() {
  const [email, setEmail] = useState<string>('')
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

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
    <div className={styles.container}>
      <AdminNavigation userEmail={email} />
      <main className={styles.main}>
        <div className={styles.mainContent}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
