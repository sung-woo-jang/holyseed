import {
  FilmCuttingFormPieces,
  FilmCuttingFormSettings,
  FilmCuttingFormVisualization,
  FilmCuttingFormHeader,
} from '@/features/film-optimizer'
import styles from './styles.module.scss'

/**
 * 필름 재단 폼 메인 콘텐츠
 */
export function FilmCuttingFormContent() {
  return (
    <div className={styles.page}>
      <FilmCuttingFormHeader />

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <FilmCuttingFormSettings />
          <FilmCuttingFormPieces />
        </div>

        <div className={styles.rightPanel}>
          <FilmCuttingFormVisualization />
        </div>
      </div>
    </div>
  )
}
