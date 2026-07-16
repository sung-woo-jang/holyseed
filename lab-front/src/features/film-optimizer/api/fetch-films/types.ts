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

export type FetchFilmsResponse = FilmListItem[]
