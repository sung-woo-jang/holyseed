import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Layout } from './components/common/Layout'
import { LoginPage } from './pages/LoginPage'
import { MainPage } from './pages/MainPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { EditProductPage } from './pages/EditProductPage'
import { NewProductPage } from './pages/NewProductPage'
import { VendorsPage } from './pages/VendorsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { ImportPage } from './pages/ImportPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/products/new" element={<NewProductPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/products/:id/edit" element={<EditProductPage />} />
                    <Route path="/vendors" element={<VendorsPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/import" element={<ImportPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
