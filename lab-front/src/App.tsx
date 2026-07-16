import { Navigate, Route, Routes } from 'react-router-dom'
import AuthBootstrap from '@/components/AuthBootstrap'
import AppLayout from '@/app/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import NotionOverviewPage from '@/pages/notion/NotionOverviewPage'
import { FilmCuttingPage, FilmCuttingFormPage } from '@/pages/film-cutting'

export default function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/notion" replace />} />
          <Route path="/notion" element={<NotionOverviewPage />} />
          <Route path="/film-cutting" element={<FilmCuttingPage />} />
          <Route path="/film-cutting/new" element={<FilmCuttingFormPage />} />
          <Route path="/film-cutting/:projectId" element={<FilmCuttingFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthBootstrap>
  )
}
