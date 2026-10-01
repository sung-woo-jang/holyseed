import { useState } from 'react'
import type { FridgeState, Place } from '@/api/types'
import { Seg, Sheet, btnPrimary, inputCls } from '@/components/ui'
import { useUiStore } from '@/stores/ui.store'
import { useFridgeActions } from '../hooks/useFridge'

const PLACES = [['냉장', '냉장'], ['냉동', '냉동'], ['실온', '실온']] as const

const stepDown = (d: number) => Math.max(1, d - (d > 30 ? 30 : d > 14 ? 7 : 1))
const stepUp = (d: number) => d + (d >= 30 ? 30 : d >= 14 ? 7 : 1)

export default function FreqSheet({ state }: { state: FridgeState }) {
  const close = useUiStore((s) => s.closeSheet)
  const toast = useUiStore((s) => s.showToast)
  const actions = useFridgeActions()
  const [name, setName] = useState('')
  const [place, setPlace] = useState<Place>('냉장')

  const add = async () => {
    const n = name.trim()
    if (!n) return
    if (state.freq.some((f) => f.name === n)) {
      toast(`${n}은(는) 이미 있어요`)
      return
    }
    const days = place === '냉동' ? 60 : place === '실온' ? 14 : state.settings.defaultDays
    setName('')
    await actions.createFreq({ name: n, place, days })
  }

  const stepBtn = 'size-11 rounded-[10px] bg-chip2 text-[22px]'

  return (
    <Sheet
      width={760}
      onClose={close}
      title={
        <div className="flex flex-col gap-0.5">
          <span>자주 사는 것 관리</span>
          <span className="text-[17px] font-normal text-sub">보관 위치와 기한은 냉장고에 넣을 때 자동으로 쓰여요</span>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        {state.freq.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] bg-card2 py-2 pl-[18px] pr-2">
            <span className="min-w-[80px] flex-1 text-[22px] font-medium">{f.name}</span>
            <Seg
              h="h-11"
              options={PLACES}
              value={f.place}
              onChange={(p) => actions.updateFreq(f.id, { place: p })}
            />
            <div className="flex items-center gap-0.5">
              <button aria-label="줄이기" className={stepBtn} onClick={() => actions.updateFreq(f.id, { days: stepDown(f.days) })}>
                −
              </button>
              <span className="tnum w-[62px] text-center text-[19px]">{f.days}일</span>
              <button aria-label="늘리기" className={stepBtn} onClick={() => actions.updateFreq(f.id, { days: stepUp(f.days) })}>
                +
              </button>
            </div>
            <button aria-label="삭제" className="size-11 rounded-[10px] bg-transparent text-[20px] text-coral" onClick={() => actions.deleteFreq(f.id)}>
              ✕
            </button>
          </div>
        ))}
        {state.freq.length === 0 && <div className="py-6 text-center text-[20px] text-sub">아직 없어요</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 border-t border-[#2f2d26] pt-3">
        <input
          className={`${inputCls} min-w-[140px] flex-1`}
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="새 품목"
        />
        <Seg h="h-12" options={PLACES} value={place} onChange={setPlace} />
        <button className={btnPrimary} onClick={add}>
          추가
        </button>
      </div>
    </Sheet>
  )
}
