import { Navigate, Route, Routes } from 'react-router-dom'
import AuthBootstrap from '@/components/AuthBootstrap'
import AppLayout from '@/app/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import { FilmCuttingPage, FilmCuttingFormPage } from '@/pages/film-cutting'
import LaofusLayout from '@/pages/laofus/LaofusLayout'
import HomePage from '@/pages/laofus/HomePage'
import ChartPage from '@/pages/laofus/ChartPage'
import CyclesPage from '@/pages/laofus/CyclesPage'
import CycleDetailPage from '@/pages/laofus/CycleDetailPage'
import TradeDetailPage from '@/pages/laofus/TradeDetailPage'
import AccountPage from '@/pages/laofus/AccountPage'
import SystemPage from '@/pages/laofus/SystemPage'
import VrOverviewPage from '@/pages/vr/VrOverviewPage'
import VrLadderPage from '@/pages/vr/VrLadderPage'
import VrFillsPage from '@/pages/vr/VrFillsPage'
import WorklogPage from '@/pages/worklog/WorklogPage'

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/laofus" replace />} />

          <Route element={<LaofusLayout />}>
            <Route path="/laofus" element={<HomePage />} />
            <Route path="/laofus/chart" element={<ChartPage />} />
            <Route path="/laofus/cycles" element={<CyclesPage />} />
            <Route path="/laofus/cycles/:cycleNo" element={<CycleDetailPage />} />
            <Route path="/laofus/cycles/:cycleNo/trades/:seq" element={<TradeDetailPage />} />
            <Route path="/laofus/account" element={<AccountPage />} />
            <Route path="/laofus/system" element={<SystemPage />} />
          </Route>

          <Route path="/vr" element={<VrOverviewPage />} />
          <Route path="/vr/ladder" element={<VrLadderPage />} />
          <Route path="/vr/fills" element={<VrFillsPage />} />

          <Route path="/worklog" element={<WorklogPage />} />

          <Route path="/film-cutting" element={<FilmCuttingPage />} />
          <Route path="/film-cutting/new" element={<FilmCuttingFormPage />} />
          <Route path="/film-cutting/:projectId" element={<FilmCuttingFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthBootstrap>
  )
}
