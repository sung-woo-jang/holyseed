import { ConfirmDialog } from '@/shared/ui-kit/confirm-dialog'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const handleSignOut = () => {
    // Zustand 상태 초기화
    auth.reset()

    // access_token 쿠키 삭제 (로그인 시 저장한 쿠키)
    document.cookie =
      'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie =
      'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // 로그인 페이지로 이동
    navigate('/sign-in', { replace: true })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='로그아웃'
      desc='정말 로그아웃 하시겠습니까? 다시 로그인해야 계정에 접근할 수 있습니다.'
      confirmText='로그아웃'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
