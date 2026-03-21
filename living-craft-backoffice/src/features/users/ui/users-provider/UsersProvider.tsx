import { type User } from '@/entities/user'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete'

type UsersState = {
  open: UsersDialogType | null
  setOpen: (type: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: (row: User | null) => void
}

const useUsersStore = createWithEqualityFn<UsersState>((set) => ({
  open: null,
  setOpen: (open: UsersDialogType | null) => set({ open }),
  currentRow: null,
  setCurrentRow: (currentRow: User | null) => set({ currentRow }),
}))

export const useUsers: StoreWithShallow<UsersState> = (keys) =>
  useStoreWithShallow(useUsersStore, keys)
