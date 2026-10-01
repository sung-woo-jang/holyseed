import type { Ingredient } from '@/api/types'
import { diffDays } from './date'

export type ExpiryStatus = '만료' | '임박' | '여유'

export interface IngredientView extends Ingredient {
  d: number
  status: ExpiryStatus
  /** Tailwind 색상 토큰 이름 */
  tone: 'coral' | 'amber' | 'teal'
}

export function expiryOf(d: number): { status: ExpiryStatus; tone: IngredientView['tone'] } {
  if (d < 0) return { status: '만료', tone: 'coral' }
  if (d <= 3) return { status: '임박', tone: 'amber' }
  return { status: '여유', tone: 'teal' }
}

export function toIngredientViews(list: Ingredient[]): IngredientView[] {
  return list
    .map((x) => {
      const d = diffDays(x.exp)
      return { ...x, d, ...expiryOf(d) }
    })
    .sort((a, b) => a.d - b.d)
}

/** 유통기한 막대 길이 (14일 기준, 최소 4%) */
export function barPercent(d: number): number {
  return Math.max(4, Math.min(100, (d / 14) * 100))
}

export const TONE_BG = { coral: 'bg-coral', amber: 'bg-amber', teal: 'bg-teal' } as const
export const TONE_TEXT = { coral: 'text-coral', amber: 'text-amber', teal: 'text-teal' } as const
