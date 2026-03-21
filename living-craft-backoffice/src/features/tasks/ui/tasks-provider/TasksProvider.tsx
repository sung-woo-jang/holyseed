import { type Task } from '@/entities/task'
import {
  type StoreWithShallow,
  useStoreWithShallow,
} from '@/shared/model/utils'
import { createWithEqualityFn } from 'zustand/traditional'

type TasksDialogType = 'create' | 'update' | 'delete' | 'import'

type TasksState = {
  open: TasksDialogType | null
  setOpen: (type: TasksDialogType | null) => void
  currentRow: Task | null
  setCurrentRow: (row: Task | null) => void
}

const useTasksStore = createWithEqualityFn<TasksState>((set) => ({
  open: null,
  setOpen: (open: TasksDialogType | null) => set({ open }),
  currentRow: null,
  setCurrentRow: (currentRow: Task | null) => set({ currentRow }),
}))

export const useTasks: StoreWithShallow<TasksState> = (keys) =>
  useStoreWithShallow(useTasksStore, keys)
