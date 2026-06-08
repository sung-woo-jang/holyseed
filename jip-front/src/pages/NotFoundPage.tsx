import { useNavigate } from 'react-router-dom'

interface NotFoundPageProps {
  variant?: 'customer' | 'admin'
}

export default function NotFoundPage({ variant = 'customer' }: NotFoundPageProps) {
  const navigate = useNavigate()

  if (variant === 'admin') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 480,
        gap: 0,
        textAlign: 'center',
        padding: '0 24px',
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--bg-deep)',
          userSelect: 'none',
        }}>
          404
        </div>
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--ink)',
          marginTop: 20,
          letterSpacing: '-0.02em',
        }}>
          페이지를 찾을 수 없습니다
        </div>
        <p style={{
          fontSize: 14,
          color: 'var(--ink-3)',
          marginTop: 8,
          lineHeight: 1.7,
        }}>
          존재하지 않거나 이동된 페이지입니다.
        </p>
        <button
          onClick={() => navigate('/admin')}
          className="btn"
          style={{ marginTop: 28 }}
        >
          대시보드로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      textAlign: 'center',
      padding: '0 24px',
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 'clamp(80px, 18vw, 140px)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: 'var(--bg-deep)',
        userSelect: 'none',
      }}>
        404
      </div>

      <div style={{
        width: 48,
        height: 3,
        background: 'var(--orange)',
        borderRadius: 999,
        margin: '24px auto 0',
      }} />

      <h1 className="h2" style={{ marginTop: 24 }}>
        페이지를 찾을 수 없어요
      </h1>
      <p className="lead" style={{ marginTop: 12, maxWidth: 340 }}>
        요청하신 페이지가 존재하지 않거나
        <br />
        다른 곳으로 이동되었습니다.
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn primary lg" onClick={() => navigate('/')}>
          홈으로 가기 <span className="arrow">→</span>
        </button>
        <button className="btn ghost lg" onClick={() => navigate(-1)}>
          이전 페이지
        </button>
      </div>
    </div>
  )
}
