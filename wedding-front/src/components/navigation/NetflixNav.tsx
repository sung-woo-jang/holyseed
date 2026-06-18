import { Link } from 'react-router-dom'
import cn from 'classnames'
import styles from './NetflixNav.module.css'

interface NetflixNavProps {
  coupleSlug: string
  groomName: string
  brideName: string
}

export default function NetflixNav({ coupleSlug, groomName, brideName }: NetflixNavProps) {
  return (
    <nav className={cn(styles.nav, styles.scrolled)}>
      <div className={styles.navContent}>
        <div className={styles.logo}>
          {groomName} ♥ {brideName}
        </div>
        <div className={styles.navLinks}>
          <Link to={`/${coupleSlug}`} className={styles.navLink}>홈</Link>
          <Link to={`/${coupleSlug}/gallery`} className={styles.navLink}>갤러리</Link>
          <Link to={`/${coupleSlug}/attendance`} className={styles.navLink}>참석응답</Link>
        </div>
      </div>
    </nav>
  )
}
