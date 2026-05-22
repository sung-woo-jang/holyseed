import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/DashboardPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AccountPage } from '@/pages/AccountPage'
import { StrategyDetailPage } from '@/pages/StrategyDetailPage'
import { TabBar } from '@/components/common/TabBar'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 30 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
      </BrowserRouter>
    </QueryClientProvider>
  )
}
