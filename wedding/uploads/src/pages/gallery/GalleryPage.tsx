import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CoupleProvider, useCouple } from '@/shared/lib/couple-context'
import UploadButton from '@/features/upload-media/UploadButton'
import { GalleryView } from '@/widgets/gallery-view/GalleryView'
import styles from './GalleryPage.module.css'

function GalleryContent() {
  const { couple, isLoading, error } = useCouple()
  const [refreshKey, setRefreshKey] = useState(0)

  if (isLoading) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (error || !couple) return <Navigate to="/login" replace />

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.main}>
          <h1 className={styles.headerTitle}>우리의 순간</h1>
          <p className={styles.headerSubtitle}>{couple.groomName} ❤️ {couple.brideName}</p>
        </div>
      </header>

      <div className={styles.main}>
        <section className={styles.uploadSection}>
          <div className={styles.uploadTitle}>추억을 공유해주세요</div>
          <p className={styles.uploadDesc}>결혼식 사진이나 영상을 업로드하면 검토 후 갤러리에 표시됩니다</p>
          <UploadButton coupleId={couple.id} onUploadComplete={() => setRefreshKey((k) => k + 1)} />
        </section>

        <section>
          <GalleryView key={refreshKey} coupleId={couple.id} />
        </section>

        <div className={styles.backButtonContainer}>
          <Link to={`/${couple.slug}`}>
            <button type="button" className={styles.backButton}>← 청첩장으로 돌아가기</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to="/login" replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <GalleryContent />
    </CoupleProvider>
  )
}
