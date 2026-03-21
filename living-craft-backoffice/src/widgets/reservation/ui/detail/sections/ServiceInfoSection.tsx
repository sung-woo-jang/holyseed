/**
 * 서비스 정보 섹션
 */
import styles from './section.module.scss'

interface ServiceInfoSectionProps {
  serviceName: string
}

export function ServiceInfoSection({ serviceName }: ServiceInfoSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>서비스 정보</h3>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>서비스</span>
          <span className={styles.infoValue}>{serviceName}</span>
        </div>
      </div>
    </div>
  )
}
