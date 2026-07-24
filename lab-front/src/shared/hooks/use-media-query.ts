import { useEffect, useState } from 'react'

/**
 * matchMedia 기반 반응형 훅
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handleChange = () => setMatches(mql.matches)
    handleChange()
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/** 앱 셸의 데스크톱 내비게이션(2중 사이드바) 전환 기준 */
export const NAV_BREAKPOINT_QUERY = '(min-width: 1024px)'

export function useIsDesktopNav(): boolean {
  return useMediaQuery(NAV_BREAKPOINT_QUERY)
}
