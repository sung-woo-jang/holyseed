import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import cn from 'classnames'
import styles from './NetflixNav.module.css'

interface NetflixNavProps {
  coupleSlug: string
  groomName: string
  brideName: string
}

export default function NetflixNav({ coupleSlug, groomName, brideName }: NetflixNavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={cn(styles.nav, { [styles.scrolled]: scrolled })}>
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
