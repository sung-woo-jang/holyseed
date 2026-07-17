export interface Schedule {
  id: number
  title: string
  startAt: string
  endAt: string | null
  allDay: boolean
  tags: string[]
  link: string | null
  memo: string | null
}

export interface ScheduleInput {
  title: string
  startAt: string
  endAt?: string | null
  allDay?: boolean
  tags?: string[]
  link?: string
  memo?: string
}
