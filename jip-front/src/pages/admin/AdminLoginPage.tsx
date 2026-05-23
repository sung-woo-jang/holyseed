import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const showToast = useToastStore((s) => s.show)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password })
      setToken(res.data.data.accessToken)
      navigate('/admin')
    } catch {
      showToast('아이디 또는 비밀번호가 틀렸어요.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, background: 'var(--ink)', borderRadius: 14, color: '#fff', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 20, marginBottom: 12 }}>집</div>
          <div className="eyebrow" style={{ display: 'block', marginBottom: 4 }}>ADMIN</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>집슐랭 관리자</h1>
        </div>

        <div className="card card-pad">
          <form onSubmit={login}>
            <div className="field">
              <label className="field-label" htmlFor="username">아이디</label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="field-label" htmlFor="password">비밀번호</label>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn primary xl w-full" style={{ marginTop: 24 }} disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <div className="center muted" style={{ marginTop: 20, fontSize: 12 }}>김장인 시공 관리 시스템</div>
      </div>
    </div>
  )
}
