/**
 * API 응답 타입 정의
 */

/**
 * 성공 응답 래퍼
 */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * 에러 응답
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

/**
 * 페이지네이션 메타 정보
 */
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
}

/**
 * 페이지네이션 요청 파라미터 (컴포넌트에서 사용)
 * page 기반 페이지네이션 (1, 2, 3, ...)
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 백엔드 API로 전송하는 페이지네이션 파라미터
 * offset 기반 페이지네이션 (0, 10, 20, ...)
 */
export interface BackendPaginationParams {
  offset?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * page를 offset으로 변환하는 헬퍼 함수
 * @param params - page 기반 페이지네이션 파라미터
 * @returns offset 기반 페이지네이션 파라미터
 *
 * @example
 * convertPageToOffset({ page: 1, limit: 5 }) // { offset: 0, limit: 5 }
 * convertPageToOffset({ page: 2, limit: 10 }) // { offset: 10, limit: 10 }
 */
export function convertPageToOffset(
  params?: PaginationParams
): BackendPaginationParams {
  if (!params) return {};

  const { page = 1, limit = 10, ...rest } = params;
  const offset = (page - 1) * limit;

  return {
    offset,
    limit,
    ...rest,
  };
}
