/**
 * 공통 API 타입 정의
 */

// ===== 공통 응답 타입 =====

export interface SuccessResponse<T> {
  success: true
  message: string
  data: T
  timestamp: string
}

export interface ErrorResponse {
  success: false
  error: string
  message: string
  statusCode: number
  timestamp: string
  path: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ===== 예약 관련 타입 =====

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

/**
 * 예약에 포함된 서비스 정보
 */
export interface ReservationService {
  id: number
  createdAt: string
  updatedAt: string
  title: string
  description: string
  iconId: number
  iconBgColor: string
  iconColor: string
  duration: string
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  icon: {
    id: number
    createdAt: string
    updatedAt: string
    name: string
    type: 'MONO' | 'COLOR'
  }
}

/**
 * 예약에 포함된 고객 정보
 */
export interface ReservationCustomer {
  id: number
  createdAt: string
  updatedAt: string
  uuid: string
  tossUserId: string
  name: string
  phone: string
  email: string
  refreshToken: string | null
}

export interface Reservation {
  id: number
  reservationNumber: string
  customerId: number
  serviceId: number
  customerName: string
  customerPhone: string
  estimateDate: string
  estimateTime: string
  estimateConfirmedAt: string | null
  constructionDate: string | null
  constructionTime: string | null
  constructionScheduledAt: string | null
  address: string
  detailAddress: string
  memo: string
  photos: string[] | null
  status: ReservationStatus
  cancelReason?: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  service: ReservationService
  customer: ReservationCustomer
}

// ===== 아이콘 관련 타입 =====

export type IconType = 'FILL' | 'MONO' | 'COLOR'

export interface Icon {
  id: number
  name: string
  type: IconType
}

/**
 * 관리자용 아이콘 목록 아이템
 * GET /api/icons 응답 (배열 내 개별 아이템)
 */
export interface IconAdminListItem {
  id: number
  name: string
  type: IconType
  createdAt: string
}

/**
 * 아이콘 목록 페이지네이션 응답
 * GET /api/icons 응답 (전체 구조)
 */
export interface IconListPaginatedResponse {
  items: IconAdminListItem[]
  total: number
  count: number
  limit: number
  offset: number
}

/**
 * 아이콘 생성 요청
 * POST /api/admin/icons
 */
export interface CreateIconRequest {
  name: string
  type: IconType
}

/**
 * 아이콘 수정 요청
 * POST /api/admin/icons/:id/update
 */
export interface UpdateIconRequest {
  name?: string
  type?: IconType
}

// ===== 서비스 관련 타입 =====

/**
 * 관리자용 서비스 목록 아이템 (간소화)
 * GET /api/services/admin 응답
 */
export interface ServiceAdminListItem {
  id: number
  title: string
  description: string
  iconName: string
  iconBgColor?: string | null
  iconColor?: string | null
  duration: string
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  regionsCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 관리자용 서비스 지역 (수정 페이지용)
 */
export interface ServiceRegionAdmin {
  districtId: number
  districtFullName: string
  districtName: string
  estimateFee: number
}

/**
 * 관리자용 서비스 스케줄 (수정 페이지용)
 */
export interface ServiceScheduleAdmin {
  estimateScheduleMode: string
  estimateAvailableDays: string[] | null
  estimateStartTime: string | null
  estimateEndTime: string | null
  estimateSlotDuration: number | null
  constructionScheduleMode: string
  constructionAvailableDays: string[] | null
  constructionStartTime: string | null
  constructionEndTime: string | null
  constructionSlotDuration: number | null
  bookingPeriodMonths: number
}

/**
 * 관리자용 서비스 상세 (수정 페이지용)
 * GET /api/services/admin/:id 응답
 */
export interface ServiceAdminDetail {
  id: number
  title: string
  description: string
  icon: Icon
  iconBgColor?: string | null
  iconColor?: string | null
  duration: string
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  regions: ServiceRegionAdmin[]
  schedule: ServiceScheduleAdmin | null
  createdAt: string
  updatedAt: string
}

export interface CityDto {
  id: string
  name: string
  estimateFee: number | null
}

export interface ServiceableRegionDto {
  id: string
  name: string
  estimateFee: number
  cities: CityDto[]
}

// 백엔드 serviceRegions 응답 타입
export interface ServiceRegionDto {
  id: number
  serviceId: number
  districtId: number
  estimateFee: string | number
  district?: {
    id: number
    name: string
    fullName: string
    parent?: {
      id: number
      name: string
    }
  }
}

// 백엔드 icon 응답 타입
export interface ServiceIconDto {
  id: number
  name: string
  type: IconType
}

export interface Service {
  id: string
  title: string
  description: string
  // 백엔드 응답용 (객체)
  icon?: ServiceIconDto | null
  // 폼 데이터용 (문자열) - 백엔드에서 직접 반환하지 않음
  iconName: string
  iconBgColor?: string | null
  iconColor?: string | null
  duration: string // "하루 종일", "2-3시간" 등
  requiresTimeSelection: boolean
  isActive: boolean
  sortOrder: number
  // 백엔드 응답 원본
  serviceRegions?: ServiceRegionDto[]
  // 변환된 데이터 (기존 호환)
  serviceableRegions: ServiceableRegionDto[]
  schedule?: ServiceSchedule | null
  holidays?: ServiceHoliday[]
  createdAt: string
  updatedAt: string
}

export interface ServiceRegionInput {
  districtId: number
  estimateFee: number
}

/**
 * 시/도별 그룹화된 지역 정보 (UI 표시용)
 * RegionFeeSelector에서 아코디언 UI를 위해 사용
 */
export interface GroupedServiceRegion {
  sidoId: number
  sidoName: string
  /** 시/도 레벨 출장비 (null이면 개별 설정만 있음) */
  sidoEstimateFee: number | null
  sigungus: {
    districtId: number
    districtName: string
    estimateFee: number
  }[]
}

export interface CreateServiceRequest {
  title: string
  description: string
  iconId: number
  iconBgColor?: string
  iconColor?: string
  duration: string
  requiresTimeSelection: boolean
  sortOrder?: number
  regions: ServiceRegionInput[]
  schedule?: ServiceScheduleInput
}

export interface UpdateServiceRequest {
  title?: string
  description?: string
  iconId?: number
  iconBgColor?: string
  iconColor?: string
  duration?: string
  requiresTimeSelection?: boolean
  sortOrder?: number
  regions?: ServiceRegionInput[]
  schedule?: ServiceScheduleInput
}

// ===== 행정구역 관련 타입 =====

export type DistrictLevel = 'SIDO' | 'SIGUNGU' | 'EUPMYEONDONG'

export interface District {
  id: number
  code: string
  name: string
  fullName: string
  level: DistrictLevel
  parentId: number | null
}

// ===== 포트폴리오 관련 타입 =====

export type PortfolioCategory =
  | '인테리어 필름'
  | '유리 청소'
  | '외부 유리'
  | '내부 유리'
  | '기타'

export interface Portfolio {
  id: string
  category: PortfolioCategory
  projectName: string
  clientName: string
  duration: string
  shortDescription: string
  detailedDescription: string
  images: string[]
  tags: string[]
  relatedServiceIds: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 관리자용 포트폴리오 타입 (백엔드 엔티티와 일치)
 * GET /api/admin/portfolios, GET /api/admin/portfolios/:id 응답
 */
export interface PortfolioAdmin {
  id: number
  category: string
  projectName: string
  client: string | null
  duration: string
  description: string
  detailedDescription: string
  images: string[]
  tags: string[]
  serviceId: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * 포트폴리오 생성 요청
 * POST /api/admin/portfolios (multipart/form-data)
 */
export interface CreatePortfolioRequest {
  category: string
  projectName: string
  client?: string
  duration: string
  description: string
  detailedDescription: string
  tags?: string[]
  relatedServiceId: number
}

/**
 * 포트폴리오 수정 요청
 * POST /api/admin/portfolios/:id (multipart/form-data)
 */
export interface UpdatePortfolioRequest {
  category?: string
  projectName?: string
  client?: string
  duration?: string
  description?: string
  detailedDescription?: string
  tags?: string[]
  relatedServiceId?: number
}

// ===== 리뷰 관련 타입 =====

export interface Review {
  id: string
  userId: string
  customerName: string
  reservationId: string
  serviceId: string
  serviceName: string
  rating: number
  content: string
  photos: string[]
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

// ===== 고객 관련 타입 =====

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalReservations: number
  totalReviews: number
  averageRating?: number
  createdAt: string
  lastReservationAt?: string
}

export interface CustomerDetail extends Customer {
  reservations: Reservation[]
  reviews: Review[]
}

// ===== 운영 설정 관련 타입 =====

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface TimeSlot {
  startTime: string // HH:mm
  endTime: string // HH:mm
  interval: number // 분 단위 (30, 60, 120)
}

export interface OperatingHours {
  estimateSlots: {
    [key in DayOfWeek]?: TimeSlot
  }
  constructionSlots: {
    [key in DayOfWeek]?: TimeSlot
  }
}

export interface Holiday {
  date: string // YYYY-MM-DD
  reason: string
  createdAt: string
}

// ===== 대시보드 관련 타입 =====

export interface DashboardStats {
  todayReservations: {
    count: number
    change: number // 전일 대비 증감률 (%)
  }
  monthlyReservations: {
    count: number
    change: number // 전월 대비 증감률 (%)
  }
  averageRating: {
    value: number
    totalReviews: number
  }
  completionRate: {
    percentage: number
    completed: number
    total: number
  }
  monthlyChart: {
    labels: string[] // 월 이름
    data: number[] // 예약 건수
  }
  serviceDistribution: {
    labels: string[] // 서비스명
    data: number[] // 건수
  }
  timeDistribution: {
    labels: string[] // 시간대
    data: number[] // 건수
  }
  recentReservations: Reservation[]
  recentReviews: Review[]
}

// ===== 필터 관련 타입 =====

export interface ReservationFilters {
  status?: ReservationStatus
  startDate?: string
  endDate?: string
  search?: string // 고객명 또는 전화번호
  page?: number
  limit?: number
}

export interface ReviewFilters {
  rating?: number
  serviceId?: string
  search?: string
  page?: number
  limit?: number
}

export interface CustomerFilters {
  search?: string
  page?: number
  limit?: number
}

// ===== 서비스 스케줄 관련 타입 =====

export enum ScheduleMode {
  GLOBAL = 'global',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  EVERYDAY = 'everyday',
  CUSTOM = 'custom',
  EVERYDAY_EXCEPT = 'everyday_except',
}

export type DayCode = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface ServiceSchedule {
  id: number
  serviceId: number
  estimateScheduleMode: ScheduleMode
  estimateAvailableDays: DayCode[] | null
  estimateStartTime: string | null
  estimateEndTime: string | null
  estimateSlotDuration: number | null
  constructionScheduleMode: ScheduleMode
  constructionAvailableDays: DayCode[] | null
  constructionStartTime: string | null
  constructionEndTime: string | null
  constructionSlotDuration: number | null
  bookingPeriodMonths: number
  createdAt: string
  updatedAt: string
}

/**
 * 서비스 스케줄 입력 타입
 *
 * 견적 및 시공 일정 설정
 */
export interface ServiceScheduleInput {
  // 견적 스케줄
  estimateScheduleMode: ScheduleMode
  estimateAvailableDays?: DayCode[]
  estimateStartTime?: string
  estimateEndTime?: string
  estimateSlotDuration?: number
  // 시공 스케줄
  constructionScheduleMode: ScheduleMode
  constructionAvailableDays?: DayCode[]
  constructionStartTime?: string
  constructionEndTime?: string
  constructionSlotDuration?: number
  // 예약 가능 기간
  bookingPeriodMonths?: number
}

export interface ServiceHoliday {
  id: number
  serviceId: number
  date: string
  reason: string
  createdAt: string
  updatedAt: string
}

export interface ServiceHolidayInput {
  date: string
  reason: string
}

// ===== 프로모션 배너 관련 타입 =====

export type PromotionLinkType = 'external' | 'internal'

/**
 * 프로모션 배너 타입
 * GET /api/admin/promotions, GET /api/admin/promotions/:id 응답
 */
export interface PromotionAdmin {
  id: number
  title: string
  subtitle: string | null
  iconId: number
  icon: {
    id: number
    name: string
    type: string
  }
  iconBgColor: string
  iconColor: string
  linkUrl: string | null
  linkType: PromotionLinkType
  startDate: string | null
  endDate: string | null
  clickCount: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * 프로모션 생성 요청
 * POST /api/admin/promotions (JSON)
 */
export interface CreatePromotionRequest {
  title: string
  subtitle?: string
  iconId: number
  iconBgColor: string
  iconColor: string
  linkUrl?: string
  linkType?: PromotionLinkType
  startDate?: string
  endDate?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * 프로모션 수정 요청
 * POST /api/admin/promotions/:id/update (JSON)
 */
export interface UpdatePromotionRequest {
  title?: string
  subtitle?: string
  iconId?: number
  iconBgColor?: string
  iconColor?: string
  linkUrl?: string
  linkType?: PromotionLinkType
  startDate?: string
  endDate?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * 프로모션 정렬 순서 변경 요청
 * POST /api/admin/promotions/reorder
 */
export interface ReorderPromotionsRequest {
  items: {
    id: number
    sortOrder: number
  }[]
}

// ===== 필름 재단 최적화 관련 타입 =====

/**
 * 필름지 목록 아이템
 * GET /api/admin/film-optimizer/films 응답
 */
export interface FilmListItem {
  id: number
  name: string
  width: number
  length: number
  description: string | null
  isActive: boolean
  projectCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 필름지 상세 정보
 * GET /api/admin/film-optimizer/films/:id 응답
 */
export type FilmDetail = FilmListItem

/**
 * 필름지 생성 요청
 * POST /api/admin/film-optimizer/films 요청
 */
export interface CreateFilmRequest {
  name: string
  width?: number // 기본값: 1220
  length?: number // 기본값: 60000
  description?: string
}

/**
 * 필름지 수정 요청
 * POST /api/admin/film-optimizer/films/:id/update 요청
 */
export interface UpdateFilmRequest {
  name?: string
  width?: number
  length?: number
  description?: string
  isActive?: boolean
}

// ===== 재단 프로젝트 관련 타입 =====

/**
 * 패킹된 직사각형 (배치 결과)
 */
export interface PackedRect {
  x: number
  y: number
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  rotated: boolean
  pieceId: number
  label: string | null
  /** 조각 목록에서의 인덱스 (1부터 시작) */
  listIndex: number
}

/**
 * 패킹 빈 (필름 롤 영역)
 */
export interface PackedBin {
  rects: PackedRect[]
  usedArea: number
  usedWidth: number
  usedHeight: number
}

/**
 * 패킹 결과 JSON 구조
 */
export interface PackingResult {
  bins: PackedBin[]
  usedLength: number
  totalUsedArea: number
  totalPieceArea: number
  totalWasteArea: number
  wastePercentage: number
}

/**
 * 재단 조각 응답
 */
export interface CuttingPiece {
  id: number
  width: number
  height: number
  quantity: number
  label: string | null
  sortOrder: number
  isCompleted: boolean
  /** 조각별 회전 허용 여부 (전역 allowRotation이 true일 때만 유효) */
  allowRotation: boolean
  /** 완료 시 고정된 배치 위치 */
  fixedPosition?: {
    x: number
    y: number
    width: number
    height: number
    rotated: boolean
  } | null
  createdAt: string
  updatedAt: string
}

/**
 * 재단 프로젝트 목록 아이템
 * GET /api/admin/film-optimizer/projects 응답
 */
export interface CuttingProjectListItem {
  id: number
  name: string
  filmId: number
  filmName: string
  filmWidth: number
  allowRotation: boolean
  wastePercentage: number | null
  usedLength: number | null
  pieceCount: number
  completedPieceCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 재단 프로젝트 상세의 필름 정보
 */
export interface CuttingProjectFilmInfo {
  id: number
  name: string
  width: number
  length: number
}

/**
 * 재단 프로젝트 상세
 * GET /api/admin/film-optimizer/projects/:id 응답
 */
export interface CuttingProjectDetail {
  id: number
  name: string
  allowRotation: boolean
  wastePercentage: number | null
  usedLength: number | null
  packingResult: PackingResult | null
  film: CuttingProjectFilmInfo
  pieces: CuttingPiece[]
  createdAt: string
  updatedAt: string
}

/**
 * 재단 조각 입력 DTO
 */
export interface CuttingPieceInput {
  width: number
  height: number
  quantity?: number // 기본값: 1
  label?: string
  allowRotation?: boolean // 기본값: true
  isCompleted?: boolean // 기본값: false
  fixedPosition?: {
    x: number
    y: number
    width: number
    height: number
    rotated: boolean
  } | null
}

/**
 * 재단 프로젝트 생성 요청
 * POST /api/admin/film-optimizer/projects 요청
 */
export interface CreateCuttingProjectRequest {
  name: string
  filmId: number
  allowRotation?: boolean // 기본값: true
  pieces?: CuttingPieceInput[]
}

/**
 * 재단 프로젝트 수정 요청
 * POST /api/admin/film-optimizer/projects/:id/update 요청
 */
export interface UpdateCuttingProjectRequest {
  name?: string
  filmId?: number
  allowRotation?: boolean
  wastePercentage?: number
  usedLength?: number
  packingResult?: PackingResult
}

/**
 * 재단 조각 추가 요청
 * POST /api/admin/film-optimizer/projects/:projectId/pieces 요청
 */
export interface AddPiecesRequest {
  pieces: CuttingPieceInput[]
}

/**
 * 재단 조각 수정 요청
 * POST /api/admin/film-optimizer/projects/:projectId/pieces/:pieceId/update 요청
 */
export interface UpdatePieceRequest {
  width?: number
  height?: number
  quantity?: number
  label?: string
  allowRotation?: boolean
  sortOrder?: number
}
