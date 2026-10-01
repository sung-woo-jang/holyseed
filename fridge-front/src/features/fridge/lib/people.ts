import type { FridgeEvent, Person } from '@/api/types'
import { ALL_COLOR } from './palette'

export function personView(people: Person[], id: number | null): { name: string; color: string } {
  if (id == null) return { name: '모두', color: ALL_COLOR }
  const p = people.find((x) => x.id === id) ?? people[0]
  return p ? { name: p.name, color: p.color } : { name: '모두', color: ALL_COLOR }
}

export interface EventView extends FridgeEvent {
  color: string
  whoLabel: string
  timeLabel: string
  repeatMark: string
}

export function toEventView(e: FridgeEvent, people: Person[]): EventView {
  const p = personView(people, e.personId)
  return {
    ...e,
    color: p.color,
    whoLabel: people.length > 1 ? p.name : '',
    timeLabel: e.time || '종일',
    repeatMark: e.repeat === 'weekly' ? ' · 매주' : '',
  }
}
