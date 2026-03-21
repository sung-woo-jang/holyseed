import { useEffect, useMemo } from 'react'
import { getCookie, setCookie, removeCookie } from '@/shared/lib/cookies'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const DEFAULT_THEME = 'system'
const THEME_COOKIE_NAME = 'vite-ui-theme'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type ThemeState = {
  defaultTheme: Theme
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

const useThemeStore = createWithEqualityFn<ThemeState>((set) => ({
  defaultTheme: DEFAULT_THEME,
  theme: (getCookie(THEME_COOKIE_NAME) as Theme) || DEFAULT_THEME,
  setTheme: (theme: Theme) => {
    setCookie(THEME_COOKIE_NAME, theme, THEME_COOKIE_MAX_AGE)
    set({ theme })
  },
  resetTheme: () => {
    removeCookie(THEME_COOKIE_NAME)
    set({ theme: DEFAULT_THEME })
  },
}))

export const useTheme: StoreWithShallow<ThemeState> = (keys) =>
  useStoreWithShallow(useThemeStore, keys)

export const useResolvedTheme = (): ResolvedTheme => {
  const { theme } = useTheme(['theme'])
  return useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme(['theme'])
  const resolvedTheme = useResolvedTheme()

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(currentResolvedTheme)
    }

    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
    }

    applyTheme(resolvedTheme)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolvedTheme])

  return <>{children}</>
}
