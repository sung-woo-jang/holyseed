import { Paintbrush, Sparkles, type LucideIcon } from 'lucide-react'

/**
 * 서비스 아이콘 옵션
 */
export interface IconOption {
  name: string
  label: string
  icon: LucideIcon
}

export const iconOptions: IconOption[] = [
  { name: 'paintbrush', label: '페인트 붓', icon: Paintbrush },
  { name: 'sparkles', label: '반짝임', icon: Sparkles },
  // TODO: 더 많은 아이콘 추가
]

/**
 * 서비스 색상 옵션
 */
export interface ColorOption {
  name: string
  label: string
  value: string
}

export const colorOptions: ColorOption[] = [
  { name: 'blue', label: '파란색', value: '#3B82F6' },
  { name: 'green', label: '초록색', value: '#10B981' },
  { name: 'purple', label: '보라색', value: '#8B5CF6' },
  { name: 'orange', label: '주황색', value: '#F97316' },
  { name: 'pink', label: '분홍색', value: '#EC4899' },
  { name: 'red', label: '빨간색', value: '#EF4444' },
]

/**
 * 한국 지역 데이터 (시/도)
 */
export const koreaRegions = [
  '서울특별시',
  '경기도',
  '인천광역시',
  '부산광역시',
  '대구광역시',
  '대전광역시',
  '광주광역시',
  '울산광역시',
  '세종특별자치시',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
]

/**
 * 서비스 활성화 상태
 */
export const serviceActiveStatuses = [
  { value: true, label: '활성', variant: 'default' as const },
  { value: false, label: '비활성', variant: 'secondary' as const },
]
