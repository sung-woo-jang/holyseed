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
      <img
        src={mediaThumbnailUrl(media.id)}
        alt={media.uploaderName || 'Guest photo'}
        className={styles.image}
      />
      {isVideo && (
        <span className={styles.playBadge}>
          <svg viewBox="0 0 8 8"><path d="M0 0l8 4-8 4z" fill="currentColor" /></svg>
        </span>
      )}
      {(media.uploaderName || media.message) && (
        <div className={styles.caption}>
          {media.uploaderName && <span className={styles.uploader}>{media.uploaderName}</span>}
          {media.message && <span className={styles.message}>{media.message}</span>}
        </div>
      )}
    </div>
  )
}
