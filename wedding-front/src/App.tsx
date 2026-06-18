import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TOKEN_KEY } from '@/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
})

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

// Guest invitation pages
const InvitationPage = lazy(() => import('./pages/InvitationPage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const AdminMediaPage = lazy(() => import('./pages/admin/MediaPage'))
const AdminContentRowsPage = lazy(() => import('./pages/admin/ContentRowsPage'))
const AdminAttendancePage = lazy(() => import('./pages/admin/AttendancePage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
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
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* 인증 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 관리자 (RequireAuth) */}
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

            {/* 하객용 청첩장 (공개) */}
            <Route path="/:coupleSlug" element={<InvitationPage />} />
            <Route path="/:coupleSlug/gallery" element={<GalleryPage />} />
            <Route path="/:coupleSlug/attendance" element={<AttendancePage />} />

            {/* 루트 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
