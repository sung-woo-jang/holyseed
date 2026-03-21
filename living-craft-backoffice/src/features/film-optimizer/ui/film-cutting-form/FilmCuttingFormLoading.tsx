import styles from './styles.module.scss'

/**
 * 필름 재단 폼 로딩 상태
 */
export function FilmCuttingFormLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loading}>
        <p>데이터를 불러오는 중...</p>
      </div>
    </div>
  )
}
