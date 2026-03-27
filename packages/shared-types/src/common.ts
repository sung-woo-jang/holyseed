export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.BAD_REQUEST]: '잘못된 요청입니다.',
  [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다.',
  [ErrorCode.FORBIDDEN]: '권한이 없습니다.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.CONFLICT]: '요청이 충돌합니다.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다.',
}

export interface PaginationRequest {
  page?: number
  limit?: number
}

export interface PaginationResponse {
  total: number
  page: number
  limit: number
  totalPages: number
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '예약 대기',
  [ReservationStatus.CONFIRMED]: '예약 확정',
  [ReservationStatus.IN_PROGRESS]: '진행 중',
  [ReservationStatus.COMPLETED]: '완료',
  [ReservationStatus.CANCELLED]: '취소',
}
