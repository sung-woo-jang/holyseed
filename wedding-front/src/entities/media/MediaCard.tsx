import type { Media } from '@/shared/types'
import { mediaThumbnailUrl } from '@/shared/types'
import styles from './MediaCard.module.css'

interface MediaCardProps {
  media: Media
  onClick: () => void
}

export function MediaCard({ media, onClick }: MediaCardProps) {
  const isVideo = media.fileType.startsWith('video/')

  return (
    <div onClick={onClick} className={styles.card}>
      <div className={styles.imageContainer}>
        <img
          src={mediaThumbnailUrl(media.id)}
          alt={media.uploaderName || 'Guest photo'}
          className={styles.image}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
        {isVideo && (
          <div className={styles.videoOverlay}>
            <svg className={styles.videoIcon} fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        )}
        <div className={styles.tint} />
      </div>
      {(media.uploaderName || media.message) && (
        <div className={styles.infoOverlay}>
          {media.uploaderName && <span className={styles.uploader}>{media.uploaderName}</span>}
          {media.message && <span className={styles.message}>{media.message}</span>}
        </div>
      )}
    </div>
  )
}
