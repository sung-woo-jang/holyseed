import { useEffect } from 'react'
import { DirectionProvider as RdxDirProvider } from '@radix-ui/react-direction'
import { getCookie, removeCookie, setCookie } from '@/shared/lib/cookies'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'

export type Direction = 'ltr' | 'rtl'

const DEFAULT_DIRECTION = 'ltr'
const DIRECTION_COOKIE_NAME = 'dir'
const DIRECTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type DirectionState = {
  defaultDir: Direction
  dir: Direction
  setDir: (dir: Direction) => void
  resetDir: () => void
}

const useDirectionStore = createWithEqualityFn<DirectionState>((set) => ({
  defaultDir: DEFAULT_DIRECTION,
  dir: (getCookie(DIRECTION_COOKIE_NAME) as Direction) || DEFAULT_DIRECTION,
  setDir: (dir: Direction) => {
    setCookie(DIRECTION_COOKIE_NAME, dir, DIRECTION_COOKIE_MAX_AGE)
    set({ dir })
  },
  resetDir: () => {
    removeCookie(DIRECTION_COOKIE_NAME)
    set({ dir: DEFAULT_DIRECTION })
  },
}))

export const useDirection: StoreWithShallow<DirectionState> = (keys) =>
  useStoreWithShallow(useDirectionStore, keys)

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { dir } = useDirection(['dir'])

  useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.setAttribute('dir', dir)
  }, [dir])

  return <RdxDirProvider dir={dir}>{children}</RdxDirProvider>
}
