import type { PortfolioCategory } from './schema'

/**
 * 포트폴리오 카테고리 옵션
 */
export const portfolioCategories: {
  value: PortfolioCategory
  label: string
}[] = [
  { value: '인테리어 필름', label: '인테리어 필름' },
  { value: '유리 청소', label: '유리 청소' },
  { value: '외부 유리', label: '외부 유리' },
  { value: '내부 유리', label: '내부 유리' },
  { value: '기타', label: '기타' },
]

/**
 * 포트폴리오 활성화 상태
 */
export const portfolioActiveStatuses = [
  { value: true, label: '활성', variant: 'default' as const },
  { value: false, label: '비활성', variant: 'secondary' as const },
]
