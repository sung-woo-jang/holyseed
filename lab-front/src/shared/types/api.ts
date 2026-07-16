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
