import {
  useEffect,
  useLayoutEffect,
  useRef,
  startTransition,
  type ReactNode,
} from 'react'
import { useParams } from 'react-router-dom'
import { useFetchCuttingProjectDetail } from '../../api'
import { useFilmCuttingForm } from '../../model'

interface FilmCuttingFormProviderProps {
  children: ReactNode
}

/**
 * 필름 재단 폼 Provider
 * - 편집 모드 설정
 * - 프로젝트 데이터 초기화
 * - cleanup 시 상태 리셋
 */
export function FilmCuttingFormProvider({
  children,
}: FilmCuttingFormProviderProps) {
  const { id } = useParams<{ id: string }>()
  const projectId = id ? Number(id) : undefined
  const { setEditingProjectId, initFromProjectDetail, reset, localPieces } =
    useFilmCuttingForm([
      'setEditingProjectId',
      'initFromProjectDetail',
      'reset',
      'localPieces',
    ])

  // 최신 localPieces를 항상 참조하는 ref (effect 의존성 없이 최신값 접근)
  const localPiecesRef = useRef(localPieces)
  useLayoutEffect(() => {
    localPiecesRef.current = localPieces
  })

  // 프로젝트 ID별 첫 초기화 여부 추적
  const isFirstInit = useRef(true)

  // 프로젝트 상세 데이터 로드
  const { data: projectDetail } = useFetchCuttingProjectDetail(projectId)

  // 편집 모드 설정 및 cleanup
  useEffect(() => {
    setEditingProjectId(id ?? null)
    isFirstInit.current = true
    return () => reset()
  }, [id, setEditingProjectId, reset])

  // 프로젝트 데이터 초기화
  useEffect(() => {
    if (projectDetail) {
      startTransition(() => {
        if (isFirstInit.current) {
          // 첫 번째 초기화: 서버 데이터 그대로 사용
          isFirstInit.current = false
          initFromProjectDetail(projectDetail)
        } else {
          // 쿼리 무효화 후 재초기화: 로컬에서 변경된 allowRotation 유지
          // (togglePieceAllowRotation은 서버에 저장하지 않으므로 로컬 값 보존)
          const localAllowRotationById = new Map(
            localPiecesRef.current.map((p) => [p.id, p.allowRotation])
          )
          const mergedPieces = projectDetail.pieces.map((serverPiece) => ({
            ...serverPiece,
            allowRotation:
              localAllowRotationById.get(serverPiece.id) ??
              serverPiece.allowRotation,
          }))
          initFromProjectDetail({ ...projectDetail, pieces: mergedPieces })
        }
      })
    }
  }, [projectDetail, initFromProjectDetail])

  return <>{children}</>
}
