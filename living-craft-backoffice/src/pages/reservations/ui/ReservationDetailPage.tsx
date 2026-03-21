/**
 * 예약 상세 페이지
 * FSD pages 레이어: 위젯을 조합하여 완전한 페이지 구성
 */
import { useNavigate, useParams } from 'react-router-dom'
import { ReservationDetailWidget } from '@/widgets/reservation'

export function ReservationDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // id가 없으면 목록으로 리다이렉트
  if (!id) {
    navigate('/reservations')
    return null
  }

  return <ReservationDetailWidget reservationId={id} />
}
