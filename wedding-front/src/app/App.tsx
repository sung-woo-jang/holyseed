import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TOKEN_KEY } from '@/shared/api'
import { CoupleProvider, DEFAULT_COUPLE_SLUG } from '@/shared/lib/couple-context'
import { ToastProvider } from '@/shared/ui/toast'
import PageSpinner from '@/shared/ui/PageSpinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
})

const LoginPage = lazy(() => import('@/pages/login/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/register/RegisterPage'))

const InvitationPage = lazy(() => import('@/pages/invitation/InvitationPage'))
const GalleryPage = lazy(() => import('@/pages/gallery/GalleryPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard/DashboardPage'))
const AdminMediaPage = lazy(() => import('@/pages/admin/media/MediaPage'))
const AdminContentRowsPage = lazy(() => import('@/pages/admin/content-rows/ContentRowsPage'))
const AdminAttendancePage = lazy(() => import('@/pages/admin/attendance/AttendancePage'))
const AdminGuestbookPage = lazy(() => import('@/pages/admin/guestbook/GuestbookPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/settings/SettingsPage'))
const AdminLayout = lazy(() => import('@/pages/admin/layout/AdminLayout'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

// 청첩장/갤러리/참석의사 페이지가 라우트를 오가도 CoupleProvider가 언마운트되지 않도록
// 공통 부모 레이아웃에서 한 번만 감싼다 — 그렇지 않으면 탭 전환마다 커플 정보를 다시
// fetch하며 "로딩 중" 화면이 매번 깜빡였음
function CoupleRouteLayout() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <Outlet />
    </CoupleProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="content-rows" element={<AdminContentRowsPage />} />
              <Route path="attendance" element={<AdminAttendancePage />} />
              <Route path="guestbook" element={<AdminGuestbookPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="/:coupleSlug" element={<CoupleRouteLayout />}>
              <Route index element={<InvitationPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="attendance" element={<AttendancePage />} />
            </Route>

            <Route path="/" element={<Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />} />
            <Route path="*" element={<Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
