import { Badge } from '@/shared/ui/badge'
import type { IconType } from '@/shared/types/api'

interface IconTypeBadgeProps {
  type: IconType
}

/**
 * 아이콘 타입 배지 컴포넌트
 *
 * FILL, MONO, COLOR 타입별로 다른 색상의 배지를 표시합니다.
 */
export function IconTypeBadge({ type }: IconTypeBadgeProps) {
  const getVariant = (iconType: IconType) => {
    switch (iconType) {
      case 'FILL':
        return 'default'
      case 'MONO':
        return 'secondary'
      case 'COLOR':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return <Badge variant={getVariant(type)}>{type}</Badge>
}
