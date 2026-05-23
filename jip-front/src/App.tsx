import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import Header from '@/components/layout/Header'
import MobileAppBar from '@/components/layout/MobileAppBar'
import MobileTabBar from '@/components/layout/MobileTabBar'
import Footer from '@/components/layout/Footer'
import AdminLayout from '@/components/layout/AdminLayout'
import Toast from '@/components/common/Toast'

// 고객 페이지
import HomePage from '@/pages/customer/HomePage'
import ServicesPage from '@/pages/customer/ServicesPage'
import ServiceDetailPage from '@/pages/customer/ServiceDetailPage'
import ProductDetailPage from '@/pages/customer/ProductDetailPage'
import CartPage from '@/pages/customer/CartPage'
import RequestPage from '@/pages/customer/RequestPage'
import RequestDonePage from '@/pages/customer/RequestDonePage'
import CasesPage from '@/pages/customer/CasesPage'
import CaseDetailPage from '@/pages/customer/CaseDetailPage'
import AboutPage from '@/pages/customer/AboutPage'
import BookingsPage from '@/pages/customer/BookingsPage'
import BookingDetailPage from '@/pages/customer/BookingDetailPage'
import JobPublicPage from '@/pages/customer/JobPublicPage'

// 관리자 페이지
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminRequests from '@/pages/admin/AdminRequests'
import AdminRequestDetail from '@/pages/admin/AdminRequestDetail'
import AdminSchedule from '@/pages/admin/AdminSchedule'
import AdminCases from '@/pages/admin/AdminCases'
import AdminJobsList from '@/pages/admin/AdminJobsList'
import AdminJobForm from '@/pages/admin/AdminJobForm'
import AdminJobDetail from '@/pages/admin/AdminJobDetail'

function AdminGuard({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="app-root">
      {!isAdmin && <Header />}
      {!isAdmin && <MobileAppBar />}
      <main className={isAdmin ? undefined : 'page-content'}>
        <Routes>
          {/* 고객 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/request-done/:code" element={<RequestDonePage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/case/:id" element={<CaseDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/booking/:code" element={<BookingDetailPage />} />
          <Route path="/jobs/:id" element={<JobPublicPage />} />

          {/* 관리자 — 로그인 */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* 관리자 — 사이드바 레이아웃 */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="requests/:code" element={<AdminRequestDetail />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="cases" element={<AdminCases />} />
            <Route path="jobs" element={<AdminJobsList />} />
            <Route path="jobs/new" element={<AdminJobForm />} />
            <Route path="jobs/:id" element={<AdminJobDetail />} />
            <Route path="jobs/:id/edit" element={<AdminJobForm />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileTabBar />}
      <Toast />
    </div>
  )
}
