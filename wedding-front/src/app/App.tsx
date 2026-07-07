import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TOKEN_KEY } from '@/shared/api'
import { ToastProvider } from '@/shared/ui/toast'

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

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ color: '#666' }}>로딩 중...</div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
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
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="/:coupleSlug" element={<InvitationPage />} />
            <Route path="/:coupleSlug/gallery" element={<GalleryPage />} />
            <Route path="/:coupleSlug/attendance" element={<AttendancePage />} />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
