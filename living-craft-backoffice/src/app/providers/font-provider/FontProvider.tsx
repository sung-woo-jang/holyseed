import { useEffect } from 'react'
import { fonts } from '@/shared/config/fonts'
import { getCookie, setCookie, removeCookie } from '@/shared/lib/cookies'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'

type Font = (typeof fonts)[number]

const FONT_COOKIE_NAME = 'font'
const FONT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

const getInitialFont = (): Font => {
  const savedFont = getCookie(FONT_COOKIE_NAME)
  return fonts.includes(savedFont as Font) ? (savedFont as Font) : fonts[0]
}

type FontState = {
  font: Font
  setFont: (font: Font) => void
  resetFont: () => void
}

const useFontStore = createWithEqualityFn<FontState>((set) => ({
  font: getInitialFont(),
  setFont: (font: Font) => {
    setCookie(FONT_COOKIE_NAME, font, FONT_COOKIE_MAX_AGE)
    set({ font })
  },
  resetFont: () => {
    removeCookie(FONT_COOKIE_NAME)
    set({ font: fonts[0] })
  },
}))

export const useFont: StoreWithShallow<FontState> = (keys) =>
  useStoreWithShallow(useFontStore, keys)

export function FontProvider({ children }: { children: React.ReactNode }) {
  const { font } = useFont(['font'])

  useEffect(() => {
    const applyFont = (font: string) => {
      const root = document.documentElement
      root.classList.forEach((cls) => {
        if (cls.startsWith('font-')) root.classList.remove(cls)
      })
      root.classList.add(`font-${font}`)
    }

    applyFont(font)
  }, [font])

  return <>{children}</>
}
