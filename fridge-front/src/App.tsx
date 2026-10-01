import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/api/client'
import type { Me } from '@/api/types'
import { Splash, btnGhost } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import AppShell from '@/features/fridge/layout/AppShell'
import HomeScreen from '@/features/fridge/screens/HomeScreen'
import CalendarScreen from '@/features/fridge/screens/CalendarScreen'
import IngredientsScreen from '@/features/fridge/screens/IngredientsScreen'
import ShoppingScreen from '@/features/fridge/screens/ShoppingScreen'
import SettingsScreen from '@/features/fridge/screens/SettingsScreen'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import LoginPage from '@/pages/LoginPage'
import OnboardingPage from '@/pages/OnboardingPage'

function Gate() {
  const token = useAuthStore((s) => s.accessToken)
  const setMe = useAuthStore((s) => s.setMe)
  const q = useQuery({
    queryKey: ['fridge', 'me'],
    queryFn: () => get<Me>('/me'),
    enabled: !!token,
    retry: false,
  })

  useEffect(() => {
    if (q.data) setMe(q.data)
  }, [q.data, setMe])

  if (!token) return <Navigate to="/login" replace />
  if (q.isPending) return <Splash />
  if (q.isError || !q.data) {
    return (
      <Splash>
        <div className="text-[22px]">연결할 수 없어요</div>
        <button className={btnGhost} onClick={() => q.refetch()}>
          다시 시도
        </button>
      </Splash>
    )
  }
  if (!q.data.household) return <OnboardingPage />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="calendar" element={<CalendarScreen />} />
        <Route path="ingredients" element={<IngredientsScreen />} />
        <Route path="shopping" element={<ShoppingScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/*" element={<Gate />} />
    </Routes>
  )
}
