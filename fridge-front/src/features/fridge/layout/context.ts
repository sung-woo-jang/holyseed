import { useOutletContext } from 'react-router-dom'
import type { FridgeState } from '@/api/types'

export interface FridgeCtx {
  state: FridgeState
  now: Date
}

export const useFridgeCtx = () => useOutletContext<FridgeCtx>()
