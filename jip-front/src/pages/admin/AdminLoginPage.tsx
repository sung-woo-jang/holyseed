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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* 브랜드 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            background: 'var(--ink)',
            borderRadius: 16,
            color: '#fff',
            fontSize: 22,
            fontFamily: 'var(--serif)',
            fontWeight: 700,
            marginBottom: 14,
          }}>집</div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>집슐랭</div>
          <div style={{ fontSize: 13, color: 'var(--ink-4)', marginTop: 4 }}>관리자 로그인</div>
        </div>

        {/* 폼 카드 */}
        <div className="form-card">
          <form onSubmit={login}>
            <div className="form-row">
              <label htmlFor="username">아이디</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="form-row" style={{ marginTop: 16 }}>
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn primary xl w-full"
              style={{ marginTop: 28 }}
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--ink-5)' }}>
          김장인 시공 관리 시스템
        </div>
      </div>
    </div>
  )
}
