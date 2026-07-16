import type { CuttingPiece, CuttingProjectDetail } from '@/shared/types/api'

/**
 * 다이얼로그 타입
 */
export type FilmCuttingFormDialogType = 'bulkInput' | 'createFilm' | null

/**
 * 조각 고정 위치 정보
 */
export interface PieceFixedPosition {
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
}

/**
 * 필름 재단 폼 상태
 */
export interface FilmCuttingFormState {
  // 다이얼로그 상태
  open: FilmCuttingFormDialogType
  setOpen: (type: FilmCuttingFormDialogType) => void

  // 프로젝트 설정
  projectName: string
  setProjectName: (name: string) => void

  selectedFilmId: string
  setSelectedFilmId: (id: string) => void

  allowRotation: boolean
  setAllowRotation: (allow: boolean) => void

  // 로컬 조각 상태
  localPieces: CuttingPiece[]
  setLocalPieces: (pieces: CuttingPiece[]) => void
  addPiece: (piece: CuttingPiece) => void
  addPieces: (pieces: CuttingPiece[]) => void
  removePiece: (pieceId: number) => void
  /** 완료 상태 토글 (완료 시 fixedPosition 설정, 해제 시 null) */
  togglePieceComplete: (
    pieceId: number,
    fixedPosition?: PieceFixedPosition | null
  ) => void
  /** 조각별 회전 허용 여부 토글 */
  togglePieceAllowRotation: (pieceId: number) => void
  /** 전체 조각 회전 허용 여부 일괄 설정 (회전 필수/불가 조각 제외) */
  setAllPiecesRotation: (allowRotation: boolean, filmWidth: number) => void

  // 편집 모드 정보
  editingProjectId: string | null
  setEditingProjectId: (id: string | null) => void

  // 초기화
  reset: () => void
  initFromProjectDetail: (detail: CuttingProjectDetail) => void
}
