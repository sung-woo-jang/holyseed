import { getCookie, setCookie } from '@/shared/lib/cookies'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'

export type Collapsible = 'offcanvas' | 'icon' | 'none'
export type Variant = 'inset' | 'sidebar' | 'floating'

const LAYOUT_COLLAPSIBLE_COOKIE_NAME = 'layout_collapsible'
const LAYOUT_VARIANT_COOKIE_NAME = 'layout_variant'
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const DEFAULT_VARIANT = 'inset'
const DEFAULT_COLLAPSIBLE = 'icon'

type LayoutState = {
  defaultCollapsible: Collapsible
  collapsible: Collapsible
  setCollapsible: (collapsible: Collapsible) => void

  defaultVariant: Variant
  variant: Variant
  setVariant: (variant: Variant) => void

  resetLayout: () => void
}

const useLayoutStore = createWithEqualityFn<LayoutState>((set) => ({
  defaultCollapsible: DEFAULT_COLLAPSIBLE,
  collapsible:
    (getCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME) as Collapsible) ||
    DEFAULT_COLLAPSIBLE,
  setCollapsible: (collapsible: Collapsible) => {
    setCookie(
      LAYOUT_COLLAPSIBLE_COOKIE_NAME,
      collapsible,
      LAYOUT_COOKIE_MAX_AGE
    )
    set({ collapsible })
  },

  defaultVariant: DEFAULT_VARIANT,
  variant:
    (getCookie(LAYOUT_VARIANT_COOKIE_NAME) as Variant) || DEFAULT_VARIANT,
  setVariant: (variant: Variant) => {
    setCookie(LAYOUT_VARIANT_COOKIE_NAME, variant, LAYOUT_COOKIE_MAX_AGE)
    set({ variant })
  },

  resetLayout: () => {
    setCookie(
      LAYOUT_COLLAPSIBLE_COOKIE_NAME,
      DEFAULT_COLLAPSIBLE,
      LAYOUT_COOKIE_MAX_AGE
    )
    setCookie(
      LAYOUT_VARIANT_COOKIE_NAME,
      DEFAULT_VARIANT,
      LAYOUT_COOKIE_MAX_AGE
    )
    set({ collapsible: DEFAULT_COLLAPSIBLE, variant: DEFAULT_VARIANT })
  },
}))

export const useLayout: StoreWithShallow<LayoutState> = (keys) =>
  useStoreWithShallow(useLayoutStore, keys)
