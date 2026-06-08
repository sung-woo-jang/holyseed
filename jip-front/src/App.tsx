import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Toast from '@/components/common/Toast'
import AdminLayout from '@/components/layout/AdminLayout'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import MobileAppBar from '@/components/layout/MobileAppBar'
import MobileTabBar from '@/components/layout/MobileTabBar'
import AdminCaseForm from '@/pages/admin/AdminCaseForm'
import AdminCases from '@/pages/admin/AdminCases'
import AdminCatalogCategories from '@/pages/admin/AdminCatalogCategories'
import AdminCatalogCategoryForm from '@/pages/admin/AdminCatalogCategoryForm'
import AdminCatalogItemForm from '@/pages/admin/AdminCatalogItemForm'
import AdminCatalogItems from '@/pages/admin/AdminCatalogItems'
import AdminCatalogProducts from '@/pages/admin/AdminCatalogProducts'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminJobDetail from '@/pages/admin/AdminJobDetail'
import AdminJobForm from '@/pages/admin/AdminJobForm'
import AdminJobsList from '@/pages/admin/AdminJobsList'
// 관리자 페이지
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminRequestDetail from '@/pages/admin/AdminRequestDetail'
import AdminRequests from '@/pages/admin/AdminRequests'
import AdminSchedule from '@/pages/admin/AdminSchedule'
import AdminSiteAssets from '@/pages/admin/AdminSiteAssets'
import PcCategoriesPage from '@/pages/admin/pc/PcCategoriesPage'
import PcComparePage from '@/pages/admin/pc/PcComparePage'
import PcImportPage from '@/pages/admin/pc/PcImportPage'
import PcLayout from '@/pages/admin/pc/PcLayout'
import PcProductDetailPage from '@/pages/admin/pc/PcProductDetailPage'
import PcProductFormPage from '@/pages/admin/pc/PcProductFormPage'
import PcVendorsPage from '@/pages/admin/pc/PcVendorsPage'
import UtilsLayout from '@/pages/admin/utils/UtilsLayout'
import WatermarkPage from '@/pages/admin/utils/WatermarkPage'
import QrCodePage from '@/pages/admin/utils/QrCodePage'
import ResizePage from '@/pages/admin/utils/ResizePage'
import NotFoundPage from '@/pages/NotFoundPage'
import BookingDetailPage from '@/pages/customer/BookingDetailPage'
import BookingsPage from '@/pages/customer/BookingsPage'
import CartPage from '@/pages/customer/CartPage'
import CaseDetailPage from '@/pages/customer/CaseDetailPage'
import CasesPage from '@/pages/customer/CasesPage'
// 고객 페이지
import HomePage from '@/pages/customer/HomePage'
import JobPublicPage from '@/pages/customer/JobPublicPage'
import ProductDetailPage from '@/pages/customer/ProductDetailPage'
import RequestDonePage from '@/pages/customer/RequestDonePage'
import RequestPage from '@/pages/customer/RequestPage'
import ServiceDetailPage from '@/pages/customer/ServiceDetailPage'
import ServicesPage from '@/pages/customer/ServicesPage'
import { useAuthStore } from '@/stores/auth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

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
      <ScrollToTop />
      {!isAdmin && <Header />}
      {!isAdmin && <MobileAppBar />}
      {isAdmin ? (
        <main>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="requests/:code" element={<AdminRequestDetail />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="cases" element={<AdminCases />} />
              <Route path="cases/new" element={<AdminCaseForm />} />
              <Route path="cases/:id" element={<AdminCaseForm />} />
              <Route path="jobs" element={<AdminJobsList />} />
              <Route path="jobs/new" element={<AdminJobForm />} />
              <Route path="jobs/:id" element={<AdminJobDetail />} />
              <Route path="jobs/:id/edit" element={<AdminJobForm />} />
              <Route path="site-assets" element={<AdminSiteAssets />} />
              <Route path="catalog/categories" element={<AdminCatalogCategories />} />
              <Route path="catalog/categories/new" element={<AdminCatalogCategoryForm />} />
              <Route path="catalog/categories/:code/edit" element={<AdminCatalogCategoryForm />} />
              <Route path="catalog/items" element={<AdminCatalogItems />} />
              <Route path="catalog/items/new" element={<AdminCatalogItemForm />} />
              <Route path="catalog/items/:code/edit" element={<AdminCatalogItemForm />} />
              <Route path="catalog/products" element={<AdminCatalogProducts />} />
              <Route path="pc" element={<PcLayout />}>
                <Route path="compare" element={<PcComparePage />} />
                <Route path="products/new" element={<PcProductFormPage />} />
                <Route path="products/:id" element={<PcProductDetailPage />} />
                <Route path="products/:id/edit" element={<Navigate to="/admin/pc/compare?categoryId=all" replace />} />
                <Route path="vendors" element={<PcVendorsPage />} />
                <Route path="categories" element={<PcCategoriesPage />} />
                <Route path="import" element={<PcImportPage />} />
              </Route>
              <Route path="utils" element={<UtilsLayout />}>
                <Route path="watermark" element={<WatermarkPage />} />
                <Route path="qrcode" element={<QrCodePage />} />
                <Route path="resize" element={<ResizePage />} />
              </Route>
              <Route path="*" element={<NotFoundPage variant="admin" />} />
            </Route>
          </Routes>
        </main>
      ) : (
        <main className="page-content">
          <div key={location.key} className="page-fade">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/service/:id" element={<ServiceDetailPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/request" element={<RequestPage />} />
              <Route path="/request-done/:code" element={<RequestDonePage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/case/:id" element={<CaseDetailPage />} />
              {/*<Route path="/about" element={<AboutPage />} />*/}
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/booking/:code" element={<BookingDetailPage />} />
              <Route path="/jobs/:id" element={<JobPublicPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
      )}
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileTabBar />}
      <Toast />
    </div>
  )
}
