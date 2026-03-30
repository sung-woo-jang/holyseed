/**
 * 서비스 수정 요청
 * POST /api/services/admin/:id/update 요청
 *
 * Phase 4: regions, schedule 필드 제거 (전역 설정 사용)
 */
export interface UpdateServiceRequest {
  title?: string
  description?: string
  iconId?: number
  iconBgColor?: string
  iconColor?: string
  duration?: string
  requiresTimeSelection?: boolean
  sortOrder?: number
}

/**
 * 서비스 수정 Mutation 변수
 */
export interface UpdateServiceVariables {
  id: string
  data: UpdateServiceRequest
}
