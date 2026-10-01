import { useState } from 'react'
import type { FridgeEvent, FridgeState, Repeat } from '@/api/types'
import { Chip, Seg, Sheet, btnDanger, btnGhost, btnPrimary, inputCls } from '@/components/ui'
import { useUiStore } from '@/stores/ui.store'
import { fmtDate, plus } from '../lib/date'
import { ALL_COLOR } from '../lib/palette'
import { useFridgeActions } from '../hooks/useFridge'

const TIMES = ['09:00', '12:00', '18:00', '20:00']

export default function EventSheet({
  state,
  event,
  date,
}: {
  state: FridgeState
  event: FridgeEvent | null
  date: string
}) {
  const close = useUiStore((s) => s.closeSheet)
  const actions = useFridgeActions()
  const multi = state.people.length > 1
  const [title, setTitle] = useState(event?.title ?? '')
  const [d, setD] = useState(event?.date ?? date)
  const [time, setTime] = useState(event?.time ?? '')
  const [personId, setPersonId] = useState<number | null>(event ? event.personId : (state.people[0]?.id ?? null))
  const [repeat, setRepeat] = useState<Repeat>(event?.repeat ?? 'none')
  const [busy, setBusy] = useState(false)

  const ready = title.trim().length > 0 && !!d

  const save = async () => {
    if (!ready || busy) return
    setBusy(true)
    const body = { title: title.trim(), date: d, time, personId, repeat }
    const r = event
      ? await actions.updateEvent(event.id, body)
      : await actions.createEvent(body, `${fmtDate(d)}에 추가했어요`)
    setBusy(false)
    if (r) close()
  }

  const remove = async () => {
    if (!event) return
    close()
    await actions.deleteEvent(event.id)
  }

  const who = [...state.people.map((p) => ({ id: p.id as number | null, name: p.name, color: p.color })), { id: null, name: '모두', color: ALL_COLOR }]

  return (
    <Sheet title={event ? '일정 수정' : '일정 추가'} onClose={close}>
      <input
        autoFocus
        className={`${inputCls} h-[60px] text-[23px]`}
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="무슨 일정인가요?"
      />

      <div className="flex flex-col gap-2">
        <span className="text-[18px] text-sub">날짜 · {d ? fmtDate(d) : ''}</span>
        <div className="flex flex-wrap items-center gap-2">
          {([['오늘', 0], ['내일', 1], ['모레', 2]] as const).map(([n, o]) => (
            <Chip key={n} on={d === plus(o)} onClick={() => setD(plus(o))}>
              {n}
            </Chip>
          ))}
          <input
            type="date"
            value={d}
            onChange={(e) => e.target.value && setD(e.target.value)}
            className="h-[50px] min-w-[150px] flex-1 rounded-xl border-[1.5px] border-line bg-bg px-3.5 text-[19px] text-ink outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[18px] text-sub">시간</span>
        <div className="flex flex-wrap items-center gap-2">
          {[['종일', ''], ...TIMES.map((t) => [t, t])].map(([n, v]) => (
            <Chip key={n} on={time === v} onClick={() => setTime(v)} className="tnum px-4">
              {n}
            </Chip>
          ))}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-[50px] min-w-[120px] flex-1 rounded-xl border-[1.5px] border-line bg-bg px-3.5 text-[19px] text-ink outline-none"
          />
        </div>
      </div>

      {multi && (
        <div className="flex flex-col gap-2">
          <span className="text-[18px] text-sub">누구</span>
          <div className="flex flex-wrap gap-2">
            {who.map((m) => {
              const on = personId === m.id
              return (
                <button
                  key={m.name}
                  onClick={() => setPersonId(m.id)}
                  style={on ? { background: m.color, borderColor: m.color } : undefined}
                  className={`h-[50px] rounded-xl border-2 px-[18px] text-[19px] font-semibold ${
                    on ? 'text-bg' : 'border-line bg-transparent text-ink'
                  }`}
                >
                  {m.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-[18px] text-sub">반복</span>
        <Seg
          h="h-11"
          options={[['안 함', 'none'], ['매주', 'weekly']] as const}
          value={repeat}
          onChange={setRepeat}
        />
      </div>

      <div className="mt-1.5 flex gap-2.5">
        {event && (
          <button className={btnDanger} onClick={remove}>
            삭제
          </button>
        )}
        <span className="flex-1" />
        <button className={btnGhost} onClick={close}>
          취소
        </button>
        <button className={`${btnPrimary} px-[30px]`} disabled={!ready || busy} onClick={save}>
          저장
        </button>
      </div>
    </Sheet>
  )
}
