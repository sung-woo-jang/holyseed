import { create } from 'zustand'
import type { FridgeEvent, Ingredient } from '@/api/types'

export type Sheet =
  | { kind: 'event'; event: FridgeEvent | null; date: string }
  | { kind: 'ingredient'; ingredient: Ingredient | null }
  | { kind: 'freq' }
  | { kind: 'shop' }
  | null

interface UiState {
  sheet: Sheet
  toast: string
  openEvent: (date: string, event?: FridgeEvent | null) => void
  openIngredient: (ingredient?: Ingredient | null) => void
  openFreq: () => void
  openShop: () => void
  closeSheet: () => void
  showToast: (msg: string) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useUiStore = create<UiState>((set) => ({
  sheet: null,
  toast: '',
  openEvent: (date, event = null) => set({ sheet: { kind: 'event', event, date } }),
  openIngredient: (ingredient = null) => set({ sheet: { kind: 'ingredient', ingredient } }),
  openFreq: () => set({ sheet: { kind: 'freq' } }),
  openShop: () => set({ sheet: { kind: 'shop' } }),
  closeSheet: () => set({ sheet: null }),
  showToast: (msg) => {
    clearTimeout(toastTimer)
    set({ toast: msg })
    toastTimer = setTimeout(() => set({ toast: '' }), 2200)
  },
}))
