import { create } from 'zustand'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (index: number) => void
  clear: () => void
}

const STORAGE_KEY = 'jip_cart'

function loadCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export const useCartStore = create<CartState>((set) => ({
  items: loadCart(),
  add: (item) =>
    set((s) => {
      const next = [...s.items, item]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { items: next }
    }),
  remove: (index) =>
    set((s) => {
      const next = s.items.filter((_, i) => i !== index)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { items: next }
    }),
  clear: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ items: [] })
  },
}))
