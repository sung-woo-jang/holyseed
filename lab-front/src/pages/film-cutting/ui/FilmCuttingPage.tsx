import { Button } from '@/shared/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/widgets/page-header'
import {
  useFetchCuttingProjects,
  useDeleteCuttingProject,
  type CuttingProjectListItem,
} from '@/features/film-optimizer/api'
import { FilmCuttingTable } from '@/features/film-optimizer/ui/film-cutting-table'
import styles from './FilmCuttingPage.module.scss'

/**
 * 필름 재단 최적화 목록 페이지
 */
export function FilmCuttingPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useFetchCuttingProjects()
  const deleteProject = useDeleteCuttingProject()

  const handleCreateProject = () => {
    navigate('/film-cutting/new')
  }

  const handleEditProject = (projectId: number) => {
    navigate(`/film-cutting/${projectId}`)
  }

  const handleDeleteProject = async (projectId: number) => {
    try {
      await deleteProject.mutateAsync(projectId)
    } catch {
      // 에러는 mutation hook에서 toast로 처리
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title='필름 재단 최적화'
        description='인테리어 필름 재단 시 손실율을 최소화하는 배치를 계산합니다.'
        action={
          <Button onClick={handleCreateProject}>
            <Plus className='h-4 w-4' />새 프로젝트
          </Button>
        }
      />

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>프로젝트를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>프로젝트를 불러오는데 실패했습니다.</p>
        </div>
      )}

      {!isLoading &&
        !error &&
        data &&
        data.length > 0 && (
          <FilmCuttingTable
            data={data as CuttingProjectListItem[]}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}

      {!isLoading && !error && (!data || data.length === 0) && (
          <div className={styles.empty}>
            <p>등록된 프로젝트가 없습니다.</p>
            <Button variant='outline' onClick={handleCreateProject}>
              <Plus className='h-4 w-4' />첫 프로젝트 만들기
            </Button>
          </div>
        )}
    </div>
  )
}
