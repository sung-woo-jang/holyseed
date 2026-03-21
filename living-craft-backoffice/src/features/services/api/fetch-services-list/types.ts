/**
 * 관리자용 서비스 목록 아이템 (간소화)
 * GET /api/services/admin 응답
 */
export interface ServiceListItem {
  id: number
  title: string
  description: string
  iconName: string
  iconBgColor: string
  iconColor: string
  duration: string
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  regionsCount: number
  createdAt: string
  updatedAt: string
}

export type FetchServicesListResponse = ServiceListItem[]
