/**
 * 고객 정보 섹션
 */
import { formatPhoneNumber } from '@/shared/lib/format'
import styles from './section.module.scss'

interface CustomerInfoSectionProps {
  customerName: string
  customerPhone: string
}

export function CustomerInfoSection({
  customerName,
  customerPhone,
}: CustomerInfoSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>고객 정보</h3>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>이름</span>
          <span className={styles.infoValue}>{customerName}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>전화번호</span>
          <span className={styles.infoValue}>
            {formatPhoneNumber(customerPhone)}
          </span>
        </div>
      </div>
    </div>
  )
}
