import { useState, useEffect, useCallback } from 'react'
import { api, TOKEN_KEY } from '@/shared/api'
import { MediaFilters } from '@/widgets/admin-media/MediaFilters'
import { MediaStats } from '@/widgets/admin-media/MediaStats'
import { MediaGrid } from '@/widgets/admin-media/MediaGrid'
import type { Media, MediaStats as IMediaStats, ModerationStatus } from '@/shared/types'
import styles from '../admin-page.module.css'

interface MediaListData {
  media: Media[]
  total: number
  stats: IMediaStats
}

export default function AdminMediaPage() {
  const [filter, setFilter] = useState<'ALL' | ModerationStatus>('PENDING')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<MediaListData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.post('/auth/me')
      .then((res) => setCoupleId(res.data.data?.coupleId ?? null))
      .catch(() => setError('세션을 불러오는데 실패했습니다.'))
  }, [])

  const fetchMedia = useCallback(async () => {
    if (!coupleId) return
    setIsLoading(true); setError(null)
    try {
      const body: any = { coupleId, limit: 24, offset: page * 24 }
      if (filter !== 'ALL') body.moderationStatus = filter
      const res = await api.post('/media/search', body)
      setData(res.data.data)
    } catch {
      setError('미디어를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [coupleId, filter, page])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  const handleModerate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await api.post(`/media/${id}/moderate`, { moderationStatus: status })
    await fetchMedia()
  }

  const handleDelete = async (id: string) => {
    await api.post(`/media/${id}/delete`)
    await fetchMedia()
  }

  if (!coupleId && !error) return <div className={styles.loading}>정보를 불러오는 중...</div>

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>미디어 관리</h1>
        <p className={styles.description}>업로드된 사진과 영상을 검토하고 승인/거부하세요.</p>
      </div>

      <MediaStats stats={data?.stats} />
      <MediaFilters current={filter} onChange={(f) => { setFilter(f); setPage(0) }} stats={data?.stats} />

      {error && <div className={styles.errorContainer}><p className={styles.errorMessage}>{error}</p></div>}

      <MediaGrid media={data?.media} isLoading={isLoading} onModerate={handleModerate} onDelete={handleDelete} />

      {data && data.total > 24 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className={styles.pageButton}>이전</button>
          <span className={styles.pageInfo}>{page + 1} / {Math.ceil(data.total / 24)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 24 >= data.total} className={styles.pageButton}>다음</button>
        </div>
      )}
    </div>
  )
}
