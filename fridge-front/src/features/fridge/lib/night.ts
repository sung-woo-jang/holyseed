import type { NightMode } from '@/api/types'

export function isNight(mode: NightMode, now: Date): boolean {
  if (mode !== 'auto') return false
  const h = now.getHours()
  return h >= 22 || h < 6
}
