import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function LoginPage() {
  const token = useAuthStore((s) => s.accessToken)
  const [params] = useSearchParams()
  if (token) return <Navigate to="/" replace />

  const start = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? ''}/api/fridge/auth/google`
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-bg px-6 pt-[env(safe-area-inset-top)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-[56px] font-bold text-amber">냉장고</div>
        <div className="text-[22px] text-sub">일정 · 재료 · 장보기를 가족과 함께</div>
      </div>
      {params.get('error') && (
        <div className="rounded-xl bg-card px-5 py-3 text-[19px] text-coral">로그인에 실패했어요. 다시 시도해주세요.</div>
      )}
      <button
        onClick={start}
        className="flex h-16 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-ink text-[22px] font-bold text-bg"
      >
        <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        Google로 시작하기
      </button>
    </div>
  )
}
