/**
 * 기타 정보 섹션
 */
import { formatDateTimeDot } from '@/shared/lib/format'
import styles from './section.module.scss'

interface OtherInfoSectionProps {
  createdAt: string
  updatedAt: string
}

export function OtherInfoSection({
  createdAt,
  updatedAt,
}: OtherInfoSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>기타 정보</h3>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>생성일</span>
          <span className={styles.infoValue}>{formatDateTimeDot(createdAt)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>수정일</span>
          <span className={styles.infoValue}>{formatDateTimeDot(updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
