/**
 * 취소 정보 섹션
 */
import { formatDateTimeDot } from '@/shared/lib/format'
import styles from './section.module.scss'
import clsx from 'clsx'

interface CancelInfoSectionProps {
  status: string
  cancelReason: string | null
  canceledAt: string | null
}

export function CancelInfoSection({
  status,
  cancelReason,
  canceledAt,
}: CancelInfoSectionProps) {
  if (status !== 'cancelled' || !cancelReason) return null

  return (
    <div className={clsx(styles.section, styles.cancelSection)}>
      <h3 className={styles.sectionTitle}>취소 정보</h3>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>취소 사유</span>
          <span className={styles.infoValue}>{cancelReason}</span>
        </div>
        {canceledAt && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>취소 일시</span>
            <span className={styles.infoValue}>
              {formatDateTimeDot(canceledAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
