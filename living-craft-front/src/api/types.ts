/**
 * Living Craft API 타입 정의
 * 백엔드 DTO와 Entity를 기반으로 작성됨
 */

// ========================================
// 공통 응답 타입
// ========================================

/**
 * 성공 응답 래퍼
 */
export interface SuccessResponse<T> {
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
export function convertPageToOffset(params?: PaginationParams): BackendPaginationParams {
  if (!params) return {};

  const { page = 1, limit = 10, ...rest } = params;
  const offset = (page - 1) * limit;

  return {
    offset,
    limit,
    ...rest,
  };
}

// ========================================
// 인증 관련 타입
// ========================================

/**
 * 로그인 요청
 */
export interface LoginRequest {
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
}

/**
 * 로그인 응답
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * 토큰 갱신 요청
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 토큰 갱신 응답
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ========================================
// 사용자 (Customer) 타입
// ========================================

/**
 * 사용자 정보
 */
export interface User {
  id: number;
  uuid: string;
  tossUserId?: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// 서비스 관련 타입
// ========================================

/**
 * 서비스 가능 지역 - 시/군/구
 */
export interface ServiceCity {
  id: string;
  name: string;
  estimateFee: number | null;
}

/**
 * 서비스 가능 지역 - 시/도
 */
export interface ServiceRegion {
  id: string;
  name: string;
  estimateFee: number;
  cities: ServiceCity[];
}

/**
 * 아이콘 타입
 */
export type IconType = 'FILL' | 'MONO' | 'COLOR';

/**
 * 아이콘 정보
 */
export interface Icon {
  id: number;
  name: string;
  type: IconType;
}

/**
 * 서비스 정보
 */
export interface Service {
  id: number;
  title: string;
  description: string;
  icon: Icon;
  iconBgColor?: string;
  iconColor?: string;
  duration: string;
  requiresTimeSelection: boolean;
  isActive?: boolean;
  sortOrder?: number;
  serviceableRegions?: ServiceRegion[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 시간 타입 (견적/시공)
 */
export type TimeType = 'estimate' | 'construction';

/**
 * 예약 가능 시간 조회 요청
 */
export interface AvailableTimesRequest {
  serviceId: number;
  date: string; // YYYY-MM-DD
  type: TimeType;
}

/**
 * 시간 슬롯 정보
 */
export interface TimeSlotDto {
  time: string; // HH:mm
  available: boolean;
}

/**
 * 예약 가능 시간 조회 응답
 */
export interface AvailableTimesResponse {
  date: string;
  dayOfWeek: string; // '월', '화', ... '일'
  isAvailable: boolean; // 전체 예약 가능 여부 (휴무일이면 false)
  times: TimeSlotDto[];
  defaultTime: string; // 하루 종일 작업 시 기본 시작 시간
  reason?: string; // 예약 불가 사유 (isAvailable이 false일 때만 반환)
}

/**
 * 월별 예약 가능 날짜 조회 요청
 */
export interface AvailableDatesRequest {
  serviceId: number;
  year: number;
  month: number; // 1-12
  type: TimeType;
}

/**
 * 예약 불가능한 날짜 정보
 */
export interface UnavailableDate {
  date: string; // YYYY-MM-DD
  reason: string;
}

/**
 * 월별 예약 가능 날짜 조회 응답
 */
export interface AvailableDatesResponse {
  year: number;
  month: number;
  unavailableDates: UnavailableDate[];
  maxDate: string; // 예약 가능 최대 날짜
}

// ========================================
// 예약 관련 타입
// ========================================

/**
 * 예약 상태
 */
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 예약 생성 요청
 */
/**
 * 예약 생성 요청
 * 고객은 견적 문의만 생성합니다. 시공 일정은 관리자가 나중에 지정합니다.
 */
export interface CreateReservationRequest {
  serviceId: string;
  estimateDate: string; // YYYY-MM-DD
  estimateTime: string; // HH:mm
  address: string;
  detailAddress: string;
  customerName: string;
  customerPhone: string;
  memo?: string;
  photos?: string[]; // 사전 업로드된 이미지 URL 배열
}

/**
 * 예약 정보
 */
export interface Reservation {
  id: number;
  reservationNumber: string;
  customer: User;
  customerId: number;
  service: Service;
  serviceId: number;
  estimateDate: string;
  estimateTime: string;
  constructionDate: string;
  constructionTime: string | null;
  address: string;
  detailAddress: string;
  customerName: string;
  customerPhone: string;
  memo: string | null;
  photos: string[] | null;
  status: ReservationStatus;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasReview?: boolean; // 리뷰 작성 여부 (옵션널)
}

/**
 * 예약 목록 조회 파라미터
 */
export interface ReservationListParams extends PaginationParams {
  status?: ReservationStatus;
}

// ========================================
// 포트폴리오 관련 타입
// ========================================

/**
 * 백엔드 포트폴리오 목록 아이템 DTO
 * GET /api/portfolios 응답의 items 배열 요소
 */
export interface PortfolioListItemDto {
  id: string;
  category: string;
  projectName: string;
  description: string;
  thumbnailImage: string;
  tags?: string[];
}

/**
 * 백엔드 포트폴리오 목록 응답 DTO
 * GET /api/portfolios 응답의 data 필드
 */
export interface PortfolioListResponseDto {
  items: PortfolioListItemDto[];
  total: number;
}

/**
 * 백엔드 포트폴리오 상세 DTO
 * GET /api/portfolios/:id 응답의 data 필드
 */
export interface PortfolioDetailDto {
  id: string;
  category: string;
  projectName: string;
  client?: string;
  duration: string;
  detailedDescription: string;
  images: string[];
  tags?: string[];
  relatedServiceId: string;
}

/**
 * 포트폴리오 정보
 */
export interface Portfolio {
  id: number;
  category: string;
  projectName: string;
  client?: string;
  duration: string;
  description: string;
  detailedDescription: string;
  images: string[];
  tags: string[];
  service: Service;
  serviceId: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 포트폴리오 목록 조회 파라미터
 */
export interface PortfolioListParams extends PaginationParams {
  category?: string;
}

/**
 * 포트폴리오 상세 (목록 응답과 동일)
 */
export type PortfolioDetail = Portfolio;

// ========================================
// 리뷰 관련 타입
// ========================================

/**
 * 리뷰 정보
 */
export interface Review {
  id: number;
  reservation: Reservation;
  reservationId: number;
  customer: User;
  customerId: number;
  service: Service;
  serviceId: number;
  rating: number; // 1-5
  comment: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 리뷰 작성 요청
 */
export interface CreateReviewRequest {
  reservationId: number;
  rating: number; // 1-5
  comment: string;
  images?: string[];
}

/**
 * 리뷰 목록 조회 파라미터
 */
export interface ReviewListParams extends PaginationParams {
  serviceId?: number;
  rating?: number;
}

/**
 * 내 리뷰 목록 조회 파라미터
 */
export interface MyReviewsParams {
  limit?: number;
  offset?: number;
}

// ========================================
// 파일 업로드 관련 타입
// ========================================

/**
 * 파일 업로드 응답
 */
export interface FileUploadResponse {
  filename: string;
  url: string;
  size: number;
}

/**
 * 다중 이미지 업로드 응답
 */
export interface MultipleImageUploadResponse {
  urls: string[];
}

// ========================================
// 프로모션 배너 관련 타입
// ========================================

/**
 * 프로모션 링크 타입
 */
export type PromotionLinkType = 'external' | 'internal';

/**
 * 프로모션 아이콘 정보
 */
export interface PromotionIcon {
  id: number;
  name: string;
  type: string;
}

/**
 * 프로모션 배너 정보 (공개 API용)
 */
export interface Promotion {
  id: number;
  title: string;
  subtitle: string | null;
  icon: PromotionIcon;
  iconBgColor: string;
  iconColor: string;
  linkUrl: string | null;
  linkType: PromotionLinkType;
}

/**
 * 프로모션 배너 목록 응답 DTO
 */
export interface PromotionListResponseDto {
  items: Promotion[];
  total: number;
}
