import { Toaster } from '@/shared/ui/sonner'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster duration={5000} />
      {import.meta.env.MODE === 'development' && (
        <ReactQueryDevtools buttonPosition='bottom-left' />
      )}
    </>
  )
}
