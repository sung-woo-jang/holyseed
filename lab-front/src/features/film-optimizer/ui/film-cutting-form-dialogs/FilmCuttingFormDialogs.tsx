import type { CuttingPiece, CuttingPieceInput } from '@/shared/types/api'
import { useFetchFilms } from '../../api'
import { useFilmCuttingForm } from '../../model'
import { BulkInputDialog } from '../bulk-input-dialog'
import { CreateFilmDialog } from '../create-film-dialog'

/**
 * 필름 재단 폼 다이얼로그 조합
 * - BulkInputDialog: 일괄 입력
 * - CreateFilmDialog: 새 필름 생성
 */
export function FilmCuttingFormDialogs() {
  const { open, setOpen, localPieces, addPieces, setSelectedFilmId, selectedFilmId } =
    useFilmCuttingForm([
      'open',
      'setOpen',
      'localPieces',
      'addPieces',
      'setSelectedFilmId',
      'selectedFilmId',
    ])

  const { data: filmsData } = useFetchFilms()
  const selectedFilm = filmsData?.find(
    (film) => film.id.toString() === selectedFilmId
  )
  const filmWidth = selectedFilm?.width ?? 1220

  // 일괄 추가 핸들러
  const handleBulkAdd = (pieces: CuttingPieceInput[]) => {
    const newPieces: CuttingPiece[] = pieces.map((piece, index) => {
      const pw = piece.width
      const ph = piece.height
      let correctedAllowRotation = piece.allowRotation ?? true

      if (pw > filmWidth && ph <= filmWidth) {
        // 케이스 B: 회전 필수
        correctedAllowRotation = true
      } else if (pw <= filmWidth && ph > filmWidth) {
        // 케이스 C: 회전 불가
        correctedAllowRotation = false
      }

      return {
        id: Date.now() + index,
        width: pw,
        height: ph,
        quantity: piece.quantity ?? 1,
        label: piece.label ?? null,
        allowRotation: correctedAllowRotation,
        sortOrder: localPieces.length + index,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })
    addPieces(newPieces)
    setOpen(null)
  }

  // 필름 생성 성공 핸들러
  const handleFilmSuccess = (filmId: number) => {
    setSelectedFilmId(filmId.toString())
    setOpen(null)
  }

  return (
    <>
      <BulkInputDialog
        open={open === 'bulkInput'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'bulkInput' : null)}
        onAdd={handleBulkAdd}
      />

      <CreateFilmDialog
        open={open === 'createFilm'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'createFilm' : null)}
        onSuccess={handleFilmSuccess}
      />
    </>
  )
}
