import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <h6>운영</h6>
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'on' : undefined)}>
          대시보드
        </NavLink>
        <NavLink to="/admin/requests" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          견적 요청
        </NavLink>
        <NavLink to="/admin/schedule" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          일정
        </NavLink>
        <NavLink to="/admin/cases" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          시공사례 관리
        </NavLink>
        <NavLink to="/admin/jobs" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          시공 일지
        </NavLink>
        <h6>콘텐츠</h6>
        <NavLink to="/admin/site-assets" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          사이트 사진
        </NavLink>
        <NavLink to="/admin/catalog/categories" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          카테고리
        </NavLink>
        <NavLink to="/admin/catalog/items" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          서비스 아이템
        </NavLink>
        <NavLink to="/admin/catalog/products" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          제품 &amp; 사진
        </NavLink>
        <NavLink to="/admin/pc" className={({ isActive }) => (isActive ? 'on' : undefined)}>
          단가표
        </NavLink>
        <h6>설정</h6>
        <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          고객 사이트로 →
        </a>
        <a onClick={logout} style={{ cursor: 'pointer' }}>
          로그아웃
        </a>
      </aside>
      <main className="admin-main">
        <div key={location.pathname} className="page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
