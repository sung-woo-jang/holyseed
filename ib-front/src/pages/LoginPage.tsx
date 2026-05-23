import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/lib/iv-api'
import { TOKEN_KEY } from '@/lib/api'

export function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await authApi.login({ email, password })
      localStorage.setItem(TOKEN_KEY, token)
      nav('/', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)', padding: 16,
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-primary)', marginBottom: 4 }}>무한매수법</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>자동매매 어시스턴트 V4.0</div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>로그인</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>이메일</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com" required
                style={{
                  width: '100%', padding: '12px', border: '1px solid var(--color-border)',
                  borderRadius: 12, fontSize: 15, background: 'var(--color-bg)',
                  color: 'var(--color-text)', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>비밀번호</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력" required
                style={{
                  width: '100%', padding: '12px', border: '1px solid var(--color-border)',
                  borderRadius: 12, fontSize: 15, background: 'var(--color-bg)',
                  color: 'var(--color-text)', boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', marginBottom: 16,
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: 10, fontSize: 13, color: '#ef4444',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'var(--color-border)' : 'var(--color-primary)',
                color: loading ? 'var(--color-text-secondary)' : '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
