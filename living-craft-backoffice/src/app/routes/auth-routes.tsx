import { SignIn } from '@/pages/auth/sign-in'
import { type RouteObject } from 'react-router-dom'

export const authRoutes: RouteObject[] = [
  {
    path: '/sign-in',
    element: <SignIn />,
  },
]
