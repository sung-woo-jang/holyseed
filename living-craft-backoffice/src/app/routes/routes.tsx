import { AuthenticatedLayout, RootLayout } from '@/app/layout'
import { CustomersPage } from '@/pages/customers'
import { Dashboard } from '@/pages/dashboard'
import { FilmCuttingFormPage, FilmCuttingPage } from '@/pages/film-cutting'
import { IconsPage } from '@/pages/icons'
import { PortfolioFormPage, PortfoliosPage } from '@/pages/portfolios'
import { PromotionFormPage, PromotionsPage } from '@/pages/promotions'
import {
  ReservationsPage,
  ReservationDetailPage,
} from '@/pages/reservations'
import { ReviewsPage } from '@/pages/reviews'
import { ServiceFormPage, ServicesPage } from '@/pages/services'
import { OperatingHoursPage } from '@/pages/settings/operating-hours'
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
          // Living Craft Routes
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'reservations',
            element: <ReservationsPage />,
          },
          {
            path: 'reservations/:id',
            element: <ReservationDetailPage />,
          },
          {
            path: 'services',
            element: <ServicesPage />,
          },
          {
            path: 'services/new',
            element: <ServiceFormPage />,
          },
          {
            path: 'services/:id/edit',
            element: <ServiceFormPage />,
          },
          {
            path: 'portfolios',
            element: <PortfoliosPage />,
          },
          {
            path: 'portfolios/new',
            element: <PortfolioFormPage />,
          },
          {
            path: 'portfolios/:id/edit',
            element: <PortfolioFormPage />,
          },
          {
            path: 'promotions',
            element: <PromotionsPage />,
          },
          {
            path: 'promotions/new',
            element: <PromotionFormPage />,
          },
          {
            path: 'promotions/:id/edit',
            element: <PromotionFormPage />,
          },
          {
            path: 'reviews',
            element: <ReviewsPage />,
          },
          {
            path: 'customers',
            element: <CustomersPage />,
          },
          {
            path: 'icons',
            element: <IconsPage />,
          },
          {
            path: 'settings/operating',
            element: <OperatingHoursPage />,
          },
          {
            path: 'film-cutting',
            element: <FilmCuttingPage />,
          },
          {
            path: 'film-cutting/new',
            element: <FilmCuttingFormPage />,
          },
          {
            path: 'film-cutting/:id',
            element: <FilmCuttingFormPage />,
          },
        ],
      },
    ],
  },
])
