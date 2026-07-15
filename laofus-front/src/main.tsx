import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Nav } from '@/components/Nav'
import { StatusProvider } from '@/lib/StatusContext'
import AccountPage from '@/pages/AccountPage'
import ChartPage from '@/pages/ChartPage'
import CycleDetailPage from '@/pages/CycleDetailPage'
import CyclesPage from '@/pages/CyclesPage'
import HomePage from '@/pages/HomePage'
import SystemPage from '@/pages/SystemPage'
import TradeDetailPage from '@/pages/TradeDetailPage'
import './globals.css'

function NotFound() {
  return (
    <main className="wrap">
      <p style={{ color: 'var(--text-muted)' }}>
        페이지 없음 — <Link to="/">홈으로</Link>
      </p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StatusProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/cycles" element={<CyclesPage />} />
          <Route path="/cycles/:cycleNo" element={<CycleDetailPage />} />
          <Route path="/cycles/:cycleNo/trades/:seq" element={<TradeDetailPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/system" element={<SystemPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </StatusProvider>
    </BrowserRouter>
  </StrictMode>
)
