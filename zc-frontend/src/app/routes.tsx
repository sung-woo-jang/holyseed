import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout';
import { DashboardPage } from '@/pages/dashboard';
import { ProductsPage } from '@/pages/products';
import { ProductDetailPage } from '@/pages/product-detail';
import { ProductMatchingPage } from '@/pages/product-matching';
import { ModelsPage } from '@/pages/models';
import { ModelCreatePage } from '@/pages/models/model-create-page';
import { ModelDetailPage } from '@/pages/models/model-detail-page';
import { CategoriesPage } from '@/pages/categories';
import { BrandsPage } from '@/pages/brands';
import { QuotesPage, QuoteCreatePage, QuoteDetailPage } from '@/pages/quotes';
import { SiteProductsPage } from '@/pages/sites';
import { CompareModelPage } from '@/pages/compare/compare-model-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'sites/:siteCode/products',
        element: <SiteProductsPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'matching',
        element: <ProductMatchingPage />,
      },
      {
        path: 'models',
        element: <ModelsPage />,
      },
      {
        path: 'models/new',
        element: <ModelCreatePage />,
      },
      {
        path: 'models/:id',
        element: <ModelDetailPage />,
      },
      {
        path: 'compare/:modelId',
        element: <CompareModelPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        path: 'brands',
        element: <BrandsPage />,
      },
      {
        path: 'quotes',
        element: <QuotesPage />,
      },
      {
        path: 'quotes/new',
        element: <QuoteCreatePage />,
      },
      {
        path: 'quotes/:id',
        element: <QuoteDetailPage />,
      },
    ],
  },
]);
