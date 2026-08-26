import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CoupleProvider, useCouple, DEFAULT_COUPLE_SLUG } from '@/shared/lib/couple-context'
import UploadButton from '@/features/upload-media/UploadButton'
import { GalleryView } from '@/widgets/gallery-view/GalleryView'
import styles from './GalleryPage.module.css'

function GalleryContent() {
  const { couple, isLoading, error } = useCouple()
  const [refreshKey, setRefreshKey] = useState(0)

  if (isLoading) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (error || !couple) return <Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />

  return (
    <div className={styles.container}>
      <div className={styles.titlecard}>
        <div className={styles.titlecardInner}>
          <p className={styles.eyebrow}>Our Story</p>
          <h1 className={styles.title}>
            {couple.groomName}
            <span className={styles.amp}>&amp;</span>
            {couple.brideName}
          </h1>
          <p className={styles.subtitle}>하객분들이 남겨주신 우리의 장면들</p>
        </div>
      </div>
      <div className={styles.sprockets} />

      <div className={styles.section}>
        <UploadButton coupleId={couple.id} onUploadComplete={() => setRefreshKey((k) => k + 1)} />
      </div>

      <div className={styles.section}>
        <GalleryView key={refreshKey} coupleId={couple.id} />
      </div>

      <div className={styles.returnRow}>
        <Link to={`/${couple.slug}`} className={styles.returnLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          청첩장으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to={`/${DEFAULT_COUPLE_SLUG}`} replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <GalleryContent />
    </CoupleProvider>
  )
}
