/**
 * 일정 정보 섹션
 */
import { formatDateTimeDot } from '@/shared/lib/format'
import styles from './section.module.scss'

interface ScheduleInfoSectionProps {
  estimateDate: string
  estimateTime: string
  constructionDate: string
  constructionTime: string | null
}

export function ScheduleInfoSection({
  estimateDate,
  estimateTime,
  constructionDate,
  constructionTime,
}: ScheduleInfoSectionProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>일정 정보</h3>
      <div className={styles.infoList}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>견적 일시</span>
          <span className={styles.infoValue}>
            {formatDateTimeDot(`${estimateDate}T${estimateTime}`)}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>시공 일시</span>
          <span className={styles.infoValue}>
            {constructionTime
              ? formatDateTimeDot(`${constructionDate}T${constructionTime}`)
              : `${formatDateTimeDot(constructionDate)} (하루 종일)`}
          </span>
        </div>
      </div>
    </div>
  )
}
