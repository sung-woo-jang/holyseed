import { useEffect, useState } from 'react'
import cn from 'classnames'
import styles from './NetflixNav.module.css'

interface NetflixNavProps {
  groomName: string
  brideName: string
}

export default function NetflixNav({ groomName, brideName }: NetflixNavProps) {
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
      </div>
    </nav>
  )
}
