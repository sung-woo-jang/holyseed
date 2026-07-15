import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { href: '/', label: '홈' },
  { href: '/chart', label: '차트' },
  { href: '/cycles', label: '사이클' },
  { href: '/account', label: '계좌' },
  { href: '/system', label: '시스템' },
]

export function Nav() {
  const { pathname } = useLocation()
  return (
    <nav
      style={{
        borderBottom: '1px solid var(--grid)',
        background: 'var(--surface-1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4, alignItems: 'center' }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, marginRight: 16, padding: '12px 0' }}>SOXL 무매</span>
        {TABS.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              to={t.href}
              style={{
                padding: '12px 12px',
                fontSize: 14,
                textDecoration: 'none',
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: active ? 600 : 400,
                borderBottom: active ? '2px solid var(--series-1)' : '2px solid transparent',
              }}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
