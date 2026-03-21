import { useEffect } from 'react'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { CommandMenu } from '@/shared/ui-kit/command-menu'
import { createWithEqualityFn } from 'zustand/traditional'

type SearchState = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const useSearchStore = createWithEqualityFn<SearchState>((set) => ({
  open: false,
  setOpen: (open: boolean) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}))

export const useSearch: StoreWithShallow<SearchState> = (keys) =>
  useStoreWithShallow(useSearchStore, keys)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const { toggle } = useSearch(['toggle'])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  return (
    <>
      {children}
      <CommandMenu />
    </>
  )
}
