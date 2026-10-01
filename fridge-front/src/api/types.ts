export type Place = '냉장' | '냉동' | '실온'
export type NightMode = 'auto' | 'off'
export type Repeat = 'none' | 'weekly'
export type Role = 'OWNER' | 'MEMBER'

export interface Person {
  id: number
  name: string
  color: string
}
export interface FreqItem {
  id: number
  name: string
  place: Place
  days: number
}
export interface Ingredient {
  id: number
  name: string
  place: Place
  exp: string
}
export interface ShopItem {
  id: number
  name: string
  done: boolean
  note: string | null
}
export interface FridgeEvent {
  id: number
  date: string
  time: string
  title: string
  personId: number | null
  repeat: Repeat
}

export interface FridgeState {
  household: { id: number; name: string }
  settings: { nightMode: NightMode; defaultDays: number }
  people: Person[]
  freq: FreqItem[]
  ingredients: Ingredient[]
  shop: ShopItem[]
  events: FridgeEvent[]
}

export interface Me {
  user: { id: number; name: string; email: string | null; avatarUrl: string | null }
  household: { id: number; name: string; nightMode: NightMode; defaultDays: number; role: Role } | null
}

export interface HouseholdMemberView {
  userId: number
  name: string
  email: string | null
  avatarUrl: string | null
  role: Role
}
