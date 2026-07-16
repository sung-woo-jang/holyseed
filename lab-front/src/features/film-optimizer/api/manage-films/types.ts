import type { FilmDetail } from '../fetch-films'

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

/**
 * 필름지 수정 Mutation 변수
 */
export interface UpdateFilmVariables {
  id: number | string
  data: UpdateFilmRequest
}

export type CreateFilmResponse = FilmDetail
export type UpdateFilmResponse = FilmDetail
