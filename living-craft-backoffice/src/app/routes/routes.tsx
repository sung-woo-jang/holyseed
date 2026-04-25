import { AuthenticatedLayout, RootLayout } from '@/app/layout'
import { Dashboard } from '@/pages/dashboard'
import { IconsPage } from '@/pages/icons'
import { ProtectedRoute } from '@/shared/components/protected-route'
import { createBrowserRouter } from 'react-router-dom'
import { authRoutes } from './auth-routes'
import { errorRoutes } from './error-routes'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Auth Routes (인증 관련)
      ...authRoutes,
      // Error Routes
      ...errorRoutes,

      // Protected Routes (인증 필요)
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'icons',
            element: <IconsPage />,
          },
        ],
      },
    ],
  },
])
