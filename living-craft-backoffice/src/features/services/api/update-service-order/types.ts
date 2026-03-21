/**
 * 서비스 순서 아이템
 */
export interface ServiceOrderItem {
  id: number
  sortOrder: number
}

/**
 * 서비스 순서 변경 요청
 * POST /api/services/admin/order 요청
 */
export interface UpdateServiceOrderRequest {
  serviceOrders: ServiceOrderItem[]
}
