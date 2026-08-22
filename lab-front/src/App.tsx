import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '@/app/layout/AppLayout'
import AuthBootstrap from '@/components/AuthBootstrap'
import LoginPage from '@/pages/auth/LoginPage'
import FinanceDashboardPage from '@/pages/dashboard/FinanceDashboardPage'
import ExpensePage from '@/pages/expense/ExpensePage'
import AccountPage from '@/pages/quant/AccountPage'
import ChartPage from '@/pages/quant/ChartPage'
import CycleDetailPage from '@/pages/quant/CycleDetailPage'
import CyclesPage from '@/pages/quant/CyclesPage'
import HomePage from '@/pages/quant/HomePage'
import QuantLayout from '@/pages/quant/QuantLayout'
import SystemPage from '@/pages/quant/SystemPage'
import TradeDetailPage from '@/pages/quant/TradeDetailPage'
import WealthPage from '@/pages/quant/WealthPage'
import VrChartPage from '@/pages/vr/VrChartPage'
import VrFillsPage from '@/pages/vr/VrFillsPage'
import VrLadderPage from '@/pages/vr/VrLadderPage'
import VrOverviewPage from '@/pages/vr/VrOverviewPage'
import VrSystemPage from '@/pages/vr/VrSystemPage'
import VrTrendPage from '@/pages/vr/VrTrendPage'
import WorklogPage from '@/pages/worklog/WorklogPage'

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/quant" replace />} />

          <Route element={<QuantLayout />}>
            <Route path="/quant" element={<HomePage />} />
            <Route path="/quant/chart" element={<ChartPage />} />
            <Route path="/quant/cycles" element={<CyclesPage />} />
            <Route path="/quant/cycles/:cycleNo" element={<CycleDetailPage />} />
            <Route path="/quant/cycles/:cycleNo/trades/:seq" element={<TradeDetailPage />} />
            <Route path="/quant/account" element={<AccountPage />} />
            <Route path="/quant/system" element={<SystemPage />} />
            <Route path="/quant/wealth" element={<WealthPage />} />
          </Route>

          <Route path="/vr" element={<VrOverviewPage />} />
          <Route path="/vr/chart" element={<VrChartPage />} />
          <Route path="/vr/trend" element={<VrTrendPage />} />
          <Route path="/vr/ladder" element={<VrLadderPage />} />
          <Route path="/vr/fills" element={<VrFillsPage />} />
          <Route path="/vr/system" element={<VrSystemPage />} />

          <Route path="/worklog/dashboard" element={<FinanceDashboardPage />} />
          <Route path="/worklog" element={<WorklogPage />} />
          <Route path="/worklog/expense" element={<ExpensePage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthBootstrap>
  )
}
