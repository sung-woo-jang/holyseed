import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/DashboardPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AccountPage } from '@/pages/AccountPage'
import { StrategyDetailPage } from '@/pages/StrategyDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TabBar } from '@/components/common/TabBar'
import { TOKEN_KEY } from '@/lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 인증 불필요 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 인증 필요 */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <div className="with-tabs">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/strategy/new" element={<OnboardingPage />} />
                    <Route path="/strategy/:id" element={<StrategyDetailPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
                <TabBar />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
