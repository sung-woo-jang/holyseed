import {
  GeneralError,
  MaintenanceError,
  NotFoundError,
  UnauthorisedError,
} from '@/pages/errors'
import { type RouteObject } from 'react-router-dom'

export const errorRoutes: RouteObject[] = [
  {
    path: '/500',
    element: <GeneralError />,
  },
  {
    path: '/404',
    element: <NotFoundError />,
  },
  {
    path: '/503',
    element: <MaintenanceError />,
  },
  {
    path: '/401',
    element: <UnauthorisedError />,
  },
  {
    path: '*',
    element: <NotFoundError />,
  },
]
