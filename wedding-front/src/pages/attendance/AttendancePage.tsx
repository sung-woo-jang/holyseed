import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CoupleProvider, useCouple } from '@/shared/lib/couple-context'
import AttendanceForm from '@/features/rsvp/AttendanceForm'
import { useToast } from '@/shared/ui/toast'
import styles from './AttendancePage.module.css'

function AttendanceContent() {
  const { couple, isLoading, error } = useCouple()
  const navigate = useNavigate()
  const toast = useToast()

  if (isLoading) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (error || !couple) return <Navigate to="/login" replace />

  const handleSuccess = () => {
    toast.success('참석 의사가 전달되었습니다. 감사합니다!')
    navigate(`/${couple.slug}`)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>참석 의사 전달</h1>
        <p>{couple.groomName} ❤️ {couple.brideName}</p>
      </header>

      <div className={styles.formCard}>
        <AttendanceForm coupleId={couple.id} onSuccess={handleSuccess} onCancel={() => navigate(-1)} />
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to="/login" replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <AttendanceContent />
    </CoupleProvider>
  )
}
