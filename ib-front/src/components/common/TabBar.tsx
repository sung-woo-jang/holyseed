import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/dashboard', label: '홈', icon: HomeIcon },
  { to: '/history', label: '히스토리', icon: ClockIcon },
  { to: '/account', label: '계정', icon: UserIcon },
]

export function TabBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
      }}
    >
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            padding: '10px 0',
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  )
}

function ClockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function UserIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
