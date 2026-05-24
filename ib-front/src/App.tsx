import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TabBar } from '@/components/common/TabBar'
import { TOKEN_KEY } from '@/lib/api'
import { AccountPage } from '@/pages/AccountPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { StrategyDetailPage } from '@/pages/StrategyDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
})

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

function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="with-tabs">{children}</div>
      <TabBar />
    </RequireAuth>
  )
}

function FullLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* 인증 불필요 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 탭바 있는 메인 탭 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <TabLayout>
                <DashboardPage />
              </TabLayout>
            }
          />
          <Route
            path="/history"
            element={
              <TabLayout>
                <HistoryPage />
              </TabLayout>
            }
          />
          <Route
            path="/account"
            element={
              <TabLayout>
                <AccountPage />
              </TabLayout>
            }
          />

          {/* 탭바 없는 풀스크린 */}
          <Route
            path="/strategy/new"
            element={
              <FullLayout>
                <OnboardingPage />
              </FullLayout>
            }
          />
          <Route
            path="/strategy/:id"
            element={
              <FullLayout>
                <StrategyDetailPage />
              </FullLayout>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
