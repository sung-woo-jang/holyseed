/**
 * 메모 섹션
 */
import styles from './section.module.scss'

interface MemoSectionProps {
  memo: string
}

export function MemoSection({ memo }: MemoSectionProps) {
  if (!memo) return null

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>메모</h3>
      <p className={styles.memoText}>{memo}</p>
    </div>
  )
}
