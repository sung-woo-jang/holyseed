import { useState } from 'react'
import type { Place } from '@/api/types'
import { useUiStore } from '@/stores/ui.store'
import { dLabel, plus } from '../lib/date'
import { TONE_BG, TONE_TEXT, barPercent, toIngredientViews } from '../lib/expiry'
import { useFridgeActions } from '../hooks/useFridge'
import { useFridgeCtx } from '../layout/context'

type Filter = '전체' | Place

export default function IngredientsScreen() {
  const { state } = useFridgeCtx()
  const ui = useUiStore()
  const actions = useFridgeActions()
  const [filter, setFilter] = useState<Filter>('전체')

  const all = toIngredientViews(state.ingredients)
  const rows = all.filter((x) => filter === '전체' || x.place === filter)
  const counts = {
    exp: all.filter((x) => x.status === '만료').length,
    soon: all.filter((x) => x.status === '임박').length,
    ok: all.filter((x) => x.status === '여유').length,
  }
  const pill = 'flex h-11 items-center rounded-full px-[18px] text-[19px] font-semibold text-bg'

  return (
    <div className="flex flex-col gap-3.5 lg:min-h-0 lg:flex-1">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 whitespace-nowrap text-[34px] font-bold lg:text-[40px]">냉장고 재료</div>
        <span className={`${pill} bg-coral`}>만료 {counts.exp}</span>
        <span className={`${pill} bg-amber`}>임박 {counts.soon}</span>
        <span className={`${pill} bg-teal`}>여유 {counts.ok}</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {(['전체', '냉장', '냉동', '실온'] as const).map((w) => {
          const n = w === '전체' ? all.length : all.filter((x) => x.place === w).length
          const on = filter === w
          return (
            <button
              key={w}
              onClick={() => setFilter(w)}
              className={`h-12 shrink-0 rounded-full border-[1.5px] px-[22px] text-[20px] font-semibold ${
                on ? 'border-amber bg-amber text-bg' : 'border-line bg-transparent text-ink'
              }`}
            >
              {w} <span className="font-normal opacity-75">{n}</span>
            </button>
          )
        })}
        <span className="ml-auto hidden whitespace-nowrap text-[18px] text-sub lg:inline">눌러서 수정</span>
      </div>

      <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex shrink-0 flex-col gap-2 rounded-2xl bg-card p-3 lg:h-[68px] lg:flex-row lg:items-center lg:gap-3 lg:p-0 lg:pr-2.5"
          >
            <button
              onClick={() => ui.openIngredient(r)}
              className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-1 text-left lg:h-full lg:grid-cols-[minmax(0,1fr)_64px_170px_150px] lg:pl-[22px]"
            >
              <span className="truncate text-[24px] font-semibold">{r.name}</span>
              <span className="text-[19px] text-sub lg:order-none">{r.place}</span>
              <span className="flex items-center gap-2">
                <b className={`tnum text-[24px] font-bold ${TONE_TEXT[r.tone]}`}>{dLabel(r.d)}</b>
                <span className={`flex h-8 items-center rounded-full px-3 text-[17px] font-semibold text-bg ${TONE_BG[r.tone]}`}>
                  {r.status}
                </span>
              </span>
              <span className="h-2.5 overflow-hidden rounded-[5px] bg-chip2 max-lg:col-span-2">
                <span className={`block h-full rounded-[5px] ${TONE_BG[r.tone]}`} style={{ width: `${barPercent(r.d)}%` }} />
              </span>
            </button>
            <button
              onClick={() => actions.finishIngredient(r.id)}
              className="h-12 whitespace-nowrap rounded-xl border-[1.5px] border-line2 bg-transparent text-[19px] lg:w-[132px]"
            >
              다 먹었어요
            </button>
          </div>
        ))}
        {rows.length === 0 && <div className="py-10 text-center text-[22px] text-sub">비어 있어요</div>}
      </div>

      <div className="flex items-center gap-3 rounded-[20px] bg-card py-3 pl-5 pr-3">
        <span className="hidden whitespace-nowrap text-[18px] text-sub sm:inline">빠르게 넣기</span>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {state.freq.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                actions.createIngredient(
                  { name: f.name, place: f.place, exp: plus(f.days) },
                  `${f.name} 넣었어요 · ${f.place} ${f.days}일`,
                )
              }
              className="h-[52px] shrink-0 whitespace-nowrap rounded-full bg-chip px-[18px] text-[19px]"
            >
              + {f.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => ui.openIngredient()}
          className="h-14 shrink-0 rounded-[14px] bg-amber px-[22px] text-[20px] font-bold text-bg"
        >
          직접 입력
        </button>
      </div>
    </div>
  )
}
