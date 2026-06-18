import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import type { Media } from '@/types'
import { api } from '@/lib/api'
import { MasonryGrid } from './MasonryGrid'
import { GalleryFilters } from './GalleryFilters'
import { GalleryLightbox } from './Lightbox'
import styles from './GalleryView.module.css'

type MediaType = 'all' | 'image' | 'video'

interface GalleryViewProps {
  coupleId: string
}

export function GalleryView({ coupleId }: GalleryViewProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<MediaType>('all')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const { ref, inView } = useInView({ threshold: 0.5, rootMargin: '200px' })

  const fetchMedia = useCallback(async (offset: number, reset: boolean) => {
    setLoading(true)
    try {
      const res = await api.post('/media/search', { coupleId, moderationStatus: 'APPROVED', limit: 24, offset })
      const items: Media[] = res.data.data?.media ?? []
      setMedia((prev) => (reset ? items : [...prev, ...items]))
      setHasMore(items.length === 24)
    } catch {
      console.error('Failed to fetch media')
    } finally {
      setLoading(false)
    }
  }, [coupleId])

  useEffect(() => { fetchMedia(0, true) }, [fetchMedia])

  useEffect(() => {
    if (inView && hasMore && !loading) fetchMedia(media.length, false)
  }, [inView, hasMore, loading, fetchMedia, media.length])

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (filter === 'all') return true
      if (filter === 'image') return item.fileType.startsWith('image/')
      if (filter === 'video') return item.fileType.startsWith('video/')
      return true
    })
  }, [media, filter])

  if (media.length === 0 && !loading) {
    return (
      <div className={styles.emptyState}>
        <svg className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className={styles.emptyTitle}>아직 사진이 없습니다</h3>
        <p className={styles.emptyDesc}>첫 번째 추억을 공유해주세요!</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <GalleryFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        stats={{ total: media.length, images: media.filter((m) => m.fileType.startsWith('image/')).length, videos: media.filter((m) => m.fileType.startsWith('video/')).length }}
      />
      <MasonryGrid media={filteredMedia} onMediaClick={(index) => setLightboxIndex(index)} />
      {hasMore && <div ref={ref} className={styles.loadingContainer}><div className={styles.spinner} /></div>}
      {lightboxIndex >= 0 && <GalleryLightbox media={filteredMedia} currentIndex={lightboxIndex} onClose={() => setLightboxIndex(-1)} onChange={setLightboxIndex} />}
    </div>
  )
}
