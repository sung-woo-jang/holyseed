import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/admin/pc/compare', label: '비교표' },
  { to: '/admin/pc/products', label: '제품' },
  { to: '/admin/pc/vendors', label: '거래처' },
  { to: '/admin/pc/categories', label: '카테고리' },
  { to: '/admin/pc/import', label: '임포트' },
]

export default function PcLayout() {
  const { pathname } = useLocation()
  if (pathname === '/admin/pc' || pathname === '/admin/pc/') {
    return <Navigate to="/admin/pc/compare" replace />
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, minHeight: 0 }}>
      <aside className="pc-side">
        <div className="pc-side-title">단가표</div>
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? 'on' : undefined)}
          >
            {label}
          </NavLink>
        ))}
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
