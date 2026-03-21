import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  type LucideIcon,
} from 'lucide-react'

/**
 * 예약 상태 정의
 */
export const reservationStatuses: {
  value: string
  label: string
  icon: LucideIcon
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}[] = [
  {
    value: 'pending',
    label: '대기',
    icon: Clock,
    variant: 'secondary',
  },
  {
    value: 'confirmed',
    label: '확정',
    icon: Calendar,
    variant: 'default',
  },
  {
    value: 'completed',
    label: '완료',
    icon: CheckCircle2,
    variant: 'outline',
  },
  {
    value: 'cancelled',
    label: '취소',
    icon: XCircle,
    variant: 'destructive',
  },
]
