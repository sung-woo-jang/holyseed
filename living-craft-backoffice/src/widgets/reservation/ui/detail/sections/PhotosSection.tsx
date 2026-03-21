/**
 * 사진 섹션
 */
import styles from './section.module.scss'

interface PhotosSectionProps {
  photos: string[]
}

export function PhotosSection({ photos }: PhotosSectionProps) {
  if (!photos || photos.length === 0) return null

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>첨부 사진 ({photos.length}장)</h3>
      <div className={styles.photosGrid}>
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={`사진 ${index + 1}`}
            className={styles.photoImage}
          />
        ))}
      </div>
    </div>
  )
}
