import { useEffect, useRef, useState } from 'react'
import { useUiStore } from '@/stores/ui.store'
import { Seg } from '@/components/ui'
import EventCard from '../components/EventCard'
import { eventsOn, monthCells, monthLabel, weekDates, weekLabel } from '../lib/calendar'
import { DOW, fmtDate, iso } from '../lib/date'
import { BLUE_HEX } from '../lib/palette'
import { personView, toEventView } from '../lib/people'
import { useFridgeCtx } from '../layout/context'

type View = 'week' | 'month'

export default function CalendarScreen() {
  const { state, now } = useFridgeCtx()
  const ui = useUiStore()
  const today = iso(now)
  const [view, setView] = useState<View>('week')
  const [offset, setOffset] = useState(0)
  const [who, setWho] = useState<'all' | number>('all')
  const [selDate, setSelDate] = useState(today)

  // 자정이 지나 날짜가 바뀌면 보던 주·달과 선택일을 오늘로 되돌린다 (보기 모드·구성원 필터는 유지)
  const prevToday = useRef(today)
  useEffect(() => {
    if (prevToday.current === today) return
    prevToday.current = today
    setOffset(0)
    setSelDate(today)
  }, [today])

  const multi = state.people.length > 1
  const activeWho = multi && who !== 'all' && !state.people.some((p) => p.id === who) ? 'all' : who
  const on = (key: string) => eventsOn(state.events, key, activeWho, multi)
  const ev = (e: Parameters<typeof toEventView>[0]) => toEventView(e, state.people)
  const label = view === 'week' ? weekLabel(offset) : monthLabel(offset)
  const selEvents = on(selDate)

  const navBtn = 'h-[52px] rounded-[14px] border-[1.5px] border-line bg-transparent text-ink'

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <div className="text-[34px] font-bold lg:text-[40px]">캘린더</div>
        <div className="min-w-0 flex-1 whitespace-nowrap text-[18px] text-sub lg:text-[22px]">{label}</div>
        <Seg
          inset="bg-card"
          h="h-11"
          options={[['주', 'week'], ['월', 'month']] as const}
          value={view}
          onChange={(v) => {
            setView(v)
            setOffset(0)
          }}
        />
        <div className="flex gap-1.5">
          <button aria-label="이전" onClick={() => setOffset(offset - 1)} className={`${navBtn} w-[52px] text-[24px]`}>
            ‹
          </button>
          <button
            onClick={() => {
              setOffset(0)
              setSelDate(today)
            }}
            className={`${navBtn} px-[18px] text-[20px]`}
          >
            오늘
          </button>
          <button aria-label="다음" onClick={() => setOffset(offset + 1)} className={`${navBtn} w-[52px] text-[24px]`}>
            ›
          </button>
        </div>
        <button
          onClick={() => ui.openEvent(view === 'month' ? selDate : today)}
          className="h-[52px] whitespace-nowrap rounded-[14px] bg-amber px-[22px] text-[20px] font-bold text-bg"
        >
          + 일정
        </button>
      </div>

      {multi && (
        <div className="flex flex-wrap gap-2">
          {[{ id: 'all' as const, name: '전체', color: '#a8a191' }, ...state.people].map((p) => {
            const sel = activeWho === p.id
            return (
              <button
                key={p.id}
                onClick={() => setWho(p.id)}
                className={`flex h-[46px] items-center gap-2 rounded-full border-[1.5px] px-5 text-[19px] font-medium ${
                  sel ? 'border-ink bg-ink text-bg' : 'border-line bg-transparent text-ink'
                }`}
              >
                <span className="size-3 rounded-full" style={{ background: p.color }} />
                {p.name}
              </button>
            )
          })}
        </div>
      )}

      {view === 'week' ? (
        <div className="grid grid-cols-1 gap-2 lg:min-h-0 lg:flex-1 lg:grid-cols-7">
          {weekDates(offset).map((d) => {
            const key = iso(d)
            const isToday = key === today
            const wd = d.getDay()
            return (
              <div
                key={key}
                className={`flex min-h-0 flex-col gap-2 overflow-hidden rounded-[18px] border-2 px-2 pb-2 pt-3 ${
                  isToday ? 'border-amber bg-[#2a2618]' : 'border-transparent bg-card'
                }`}
              >
                <div className="flex items-baseline gap-1.5 px-1">
                  <span
                    className="text-[18px]"
                    style={{ color: wd === 0 ? '#ff8a6b' : wd === 6 ? BLUE_HEX : '#a8a191' }}
                  >
                    {DOW[wd]}
                  </span>
                  <span className={`text-[26px] font-bold ${isToday ? 'text-amber' : 'text-ink'}`}>{d.getDate()}</span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1.5 lg:overflow-y-auto">
                  {on(key).map((e) => {
                    const v = ev(e)
                    return (
                      <button
                        key={e.id}
                        onClick={() => ui.openEvent(e.date, e)}
                        style={{ borderLeftColor: v.color }}
                        className="flex shrink-0 flex-col rounded-xl border-l-4 bg-card2 px-2.5 py-2 text-left"
                      >
                        <span className="tnum text-[16px] text-amber">
                          {v.timeLabel}
                          {v.repeatMark}
                        </span>
                        <span className="text-[19px] leading-[1.3]">{v.title}</span>
                      </button>
                    )
                  })}
                </div>
                <button
                  aria-label="이 날 일정 추가"
                  onClick={() => ui.openEvent(key)}
                  className="h-11 shrink-0 rounded-xl border-[1.5px] border-dashed border-line bg-transparent text-[22px] text-sub"
                >
                  +
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-1.5 lg:min-h-0">
            <div className="grid grid-cols-7 gap-1.5">
              {['월', '화', '수', '목', '금', '토', '일'].map((n, i) => (
                <div
                  key={n}
                  className="text-center text-[17px]"
                  style={{ color: i === 6 ? '#ff8a6b' : i === 5 ? BLUE_HEX : '#a8a191' }}
                >
                  {n}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 lg:min-h-0 lg:flex-1 lg:grid-rows-6">
              {monthCells(offset).map((c) => {
                const evs = on(c.key)
                const isToday = c.key === today
                const isSel = c.key === selDate
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelDate(c.key)}
                    className={`flex aspect-square min-h-0 flex-col items-start justify-between rounded-[14px] border-2 px-1.5 py-1.5 lg:aspect-auto lg:px-2.5 lg:py-2 ${
                      isSel ? 'bg-[#2e2b22]' : 'bg-[#1c1b16]'
                    } ${isToday ? 'border-amber' : isSel ? 'border-line2' : 'border-transparent'} ${
                      isToday ? 'text-amber' : c.inMonth ? 'text-ink' : 'text-[#5a5548]'
                    }`}
                  >
                    <span className="text-[18px] font-semibold lg:text-[22px]">{c.date.getDate()}</span>
                    <span className="flex h-3 items-center gap-1">
                      {evs.slice(0, 3).map((e) => (
                        <span key={e.id} className="size-2 rounded-full lg:size-2.5" style={{ background: personView(state.people, e.personId).color }} />
                      ))}
                      {evs.length > 3 && <span className="text-[14px] text-sub">+{evs.length - 3}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 rounded-[22px] bg-card p-[22px] lg:min-h-0">
            <div className="text-[24px] font-semibold">{fmtDate(selDate)}</div>
            <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {selEvents.map((e) => (
                <EventCard key={e.id} ev={ev(e)} showRepeat onClick={() => ui.openEvent(e.date, e)} />
              ))}
              {selEvents.length === 0 && <div className="text-[20px] text-sub">일정이 없어요</div>}
            </div>
            <button
              onClick={() => ui.openEvent(selDate)}
              className="h-14 rounded-[14px] border-[1.5px] border-dashed border-line2 bg-transparent text-[20px]"
            >
              + 이 날에 일정 추가
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
