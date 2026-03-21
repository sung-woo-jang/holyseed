import {
  useStoreWithShallow,
  type StoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'
import type { FilmCuttingFormState } from './types'

const initialState = {
  open: null as FilmCuttingFormState['open'],
  projectName: '',
  selectedFilmId: '',
  allowRotation: true,
  localPieces: [],
  editingProjectId: null,
}

const useFilmCuttingFormStore = createWithEqualityFn<FilmCuttingFormState>(
  (set) => ({
    // 초기 상태
    ...initialState,

    // 다이얼로그
    setOpen: (open) => set({ open }),

    // 프로젝트 설정
    setProjectName: (projectName) => set({ projectName }),
    setSelectedFilmId: (selectedFilmId) => set({ selectedFilmId }),
    setAllowRotation: (allowRotation) => set({ allowRotation }),

    // 로컬 조각 관리
    setLocalPieces: (localPieces) => set({ localPieces }),

    addPiece: (piece) =>
      set((state) => ({
        localPieces: [...state.localPieces, piece],
      })),

    addPieces: (pieces) =>
      set((state) => ({
        localPieces: [...state.localPieces, ...pieces],
      })),

    removePiece: (pieceId) =>
      set((state) => ({
        localPieces: state.localPieces.filter((p) => p.id !== pieceId),
      })),

    togglePieceComplete: (pieceId, fixedPosition) =>
      set((state) => ({
        localPieces: state.localPieces.map((p) => {
          if (p.id !== pieceId) return p
          const newIsCompleted = !p.isCompleted
          return {
            ...p,
            isCompleted: newIsCompleted,
            // 완료 시 fixedPosition 설정, 해제 시 null
            fixedPosition: newIsCompleted ? (fixedPosition ?? null) : null,
          }
        }),
      })),

    togglePieceAllowRotation: (pieceId) =>
      set((state) => ({
        localPieces: state.localPieces.map((p) =>
          p.id === pieceId ? { ...p, allowRotation: !p.allowRotation } : p
        ),
      })),

    setAllPiecesRotation: (allowRotation, filmWidth) =>
      set((state) => ({
        localPieces: state.localPieces.map((p) => {
          const rotationRequired = p.width > filmWidth && p.height <= filmWidth
          const rotationImpossible = p.width <= filmWidth && p.height > filmWidth
          if (rotationRequired) return { ...p, allowRotation: true }
          if (rotationImpossible) return { ...p, allowRotation: false }
          return { ...p, allowRotation }
        }),
      })),

    // 편집 모드
    setEditingProjectId: (editingProjectId) => set({ editingProjectId }),

    // 초기화
    reset: () => set(initialState),

    initFromProjectDetail: (detail) =>
      set({
        projectName: detail.name,
        selectedFilmId: detail.film.id.toString(),
        allowRotation: detail.allowRotation,
        localPieces: detail.pieces,
      }),
  })
)

/**
 * 필름 재단 폼 상태 훅
 *
 * @example
 * const { projectName, setProjectName } = useFilmCuttingFormStore([
 *   'projectName',
 *   'setProjectName',
 * ])
 */
export const useFilmCuttingFormStore_: StoreWithShallow<
  FilmCuttingFormState
> = (keys) => useStoreWithShallow(useFilmCuttingFormStore, keys)

// 별칭 export
export { useFilmCuttingFormStore_ as useFilmCuttingForm }
