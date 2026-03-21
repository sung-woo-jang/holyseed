import type { PackingResult, CuttingPiece } from '../fetch-cutting-projects'

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
 * 재단 프로젝트 수정 Mutation 변수
 */
export interface UpdateCuttingProjectVariables {
  id: number | string
  data: UpdateCuttingProjectRequest
}

/**
 * 재단 조각 추가 요청
 * POST /api/admin/film-optimizer/projects/:projectId/pieces 요청
 */
export interface AddPiecesRequest {
  pieces: CuttingPieceInput[]
}

/**
 * 재단 조각 추가 Mutation 변수
 */
export interface AddPiecesVariables {
  projectId: number | string
  data: AddPiecesRequest
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

/**
 * 재단 조각 수정 Mutation 변수
 */
export interface UpdatePieceVariables {
  projectId: number | string
  pieceId: number | string
  data: UpdatePieceRequest
}

/**
 * 재단 조각 삭제 Mutation 변수
 */
export interface PieceActionVariables {
  projectId: number | string
  pieceId: number | string
}

/**
 * 재단 완료 토글 요청
 */
export interface TogglePieceCompleteRequest {
  fixedPosition?: {
    x: number
    y: number
    width: number
    height: number
    rotated: boolean
  }
}

/**
 * 재단 완료 토글 Mutation 변수
 */
export interface TogglePieceCompleteVariables {
  projectId: number | string
  pieceId: number | string
  data?: TogglePieceCompleteRequest
}

export type AddPiecesResponse = CuttingPiece[]
export type UpdatePieceResponse = CuttingPiece
export type TogglePieceCompleteResponse = CuttingPiece
