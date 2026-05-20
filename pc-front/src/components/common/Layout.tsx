import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

const navLinks = [
  { to: '/', label: '비교' },
  { to: '/vendors', label: '업체' },
  { to: '/categories', label: '카테고리' },
  { to: '/import', label: '임포트' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-gray-900">단가표 비교</Link>
          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/products/new"
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            + 제품 추가
          </Link>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
