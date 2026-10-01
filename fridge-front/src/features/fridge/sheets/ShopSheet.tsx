import { useState } from 'react'
import type { FridgeState } from '@/api/types'
import { Sheet, btnGhost, btnPrimary, inputCls } from '@/components/ui'
import { useUiStore } from '@/stores/ui.store'
import { useFridgeActions } from '../hooks/useFridge'

export default function ShopSheet({ state }: { state: FridgeState }) {
  const close = useUiStore((s) => s.closeSheet)
  const toast = useUiStore((s) => s.showToast)
  const actions = useFridgeActions()
  const [text, setText] = useState('')

  const add = async () => {
    const v = text.trim()
    if (!v) return
    if (state.shop.some((x) => x.name === v && !x.done)) {
      toast(`${v}은(는) 이미 있어요`)
      return
    }
    setText('')
    await actions.createShop(v)
  }

  return (
    <Sheet title="장보기 추가" width={620} onClose={close}>
      <div className="flex gap-2">
        <input
          autoFocus
          className={`${inputCls} h-[60px] flex-1 text-[23px]`}
          value={text}
          maxLength={50}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="품목 이름"
        />
        <button className={`${btnPrimary} h-[60px]`} onClick={add}>
          추가
        </button>
      </div>
      <span className="text-[18px] text-sub">자주 사는 것</span>
      <div className="flex flex-wrap gap-2">
        {state.freq.map((f) => {
          const open = state.shop.find((x) => x.name === f.name && !x.done)
          return (
            <button
              key={f.id}
              onClick={() => (open ? actions.deleteShop(open.id) : actions.createShop(f.name))}
              className={`h-12 rounded-full px-4 text-[19px] ${open ? 'bg-[#2a3a31] text-teal' : 'bg-chip text-ink'}`}
            >
              {open ? '✓ ' : '+ '}
              {f.name}
            </button>
          )
        })}
      </div>
      <button className={`${btnGhost} self-end`} onClick={close}>
        완료
      </button>
    </Sheet>
  )
}
