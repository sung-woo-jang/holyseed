import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/lib/iv-api'
import { TOKEN_KEY } from '@/lib/api'

export function RegisterPage() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true)
    try {
      const { token } = await authApi.register({ email, password, name })
      localStorage.setItem(TOKEN_KEY, token)
      nav('/', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', border: '1px solid var(--color-border)',
    borderRadius: 12, fontSize: 15, background: 'var(--color-bg)',
    color: 'var(--color-text)', boxSizing: 'border-box',
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
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>회원가입</h2>

          <form onSubmit={handleSubmit}>
            {[
              { label: '이름', value: name, set: setName, type: 'text', placeholder: '이름 입력' },
              { label: '이메일', value: email, set: setEmail, type: 'email', placeholder: 'email@example.com' },
              { label: '비밀번호 (6자 이상)', value: password, set: setPassword, type: 'password', placeholder: '비밀번호 입력' },
              { label: '비밀번호 확인', value: confirm, set: setConfirm, type: 'password', placeholder: '비밀번호 재입력' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
                <input
                  type={type} value={value} onChange={(e) => set(e.target.value)}
                  placeholder={placeholder} required
                  style={inputStyle}
                />
              </div>
            ))}

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
                width: '100%', padding: '14px', marginTop: 8,
                background: loading ? 'var(--color-border)' : 'var(--color-primary)',
                color: loading ? 'var(--color-text-secondary)' : '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
