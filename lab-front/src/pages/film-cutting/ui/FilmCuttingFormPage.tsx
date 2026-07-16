import { useParams } from 'react-router-dom'
import {
  useFetchFilms,
  useFetchCuttingProjectDetail,
} from '@/features/film-optimizer/api'
import {
  FilmCuttingForm,
  FilmCuttingFormProvider,
  FilmCuttingFormDialogs,
} from '@/features/film-optimizer/ui'

/**
 * 필름 재단 프로젝트 생성/수정 페이지
 */
export function FilmCuttingFormPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = id ? Number(id) : undefined

  // 로딩 상태 확인
  const { isLoading: filmsLoading } = useFetchFilms()
  const { isLoading: projectLoading } = useFetchCuttingProjectDetail(projectId)

  const isLoading = filmsLoading || (Boolean(projectId) && projectLoading)

  if (isLoading) {
    return <FilmCuttingForm.Loading />
  }

  return (
    <FilmCuttingFormProvider>
      <FilmCuttingForm>
        <FilmCuttingForm.Content />
      </FilmCuttingForm>
      <FilmCuttingFormDialogs />
    </FilmCuttingFormProvider>
  )
}
