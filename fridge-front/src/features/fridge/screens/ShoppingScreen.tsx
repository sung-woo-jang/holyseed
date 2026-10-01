import { useState } from 'react'
import { useUiStore } from '@/stores/ui.store'
import { btnGhost, btnPrimary, inputCls } from '@/components/ui'
import ShopCheckRow from '../components/ShopRow'
import { useFridgeActions } from '../hooks/useFridge'
import { useFridgeCtx } from '../layout/context'

export default function ShoppingScreen() {
  const { state } = useFridgeCtx()
  const ui = useUiStore()
  const actions = useFridgeActions()
  const [text, setText] = useState('')

  const left = state.shop.filter((x) => !x.done).length
  const done = state.shop.length - left
  const rows = [...state.shop].sort((a, b) => Number(a.done) - Number(b.done))
  const openNames = new Set(state.shop.filter((x) => !x.done).map((x) => x.name))

  const add = async () => {
    const v = text.trim()
    if (!v) return
    if (openNames.has(v)) {
      ui.showToast(`${v}은(는) 이미 있어요`)
      return
    }
    setText('')
    await actions.createShop(v)
  }

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="text-[34px] font-bold lg:text-[40px]">장보기</div>
        <div className="min-w-0 flex-1 text-[19px] text-sub lg:text-[21px]">
          {left}개 남음 · 담은 물건 {done}개
        </div>
        <button className={btnGhost} style={{ opacity: done ? 1 : 0.35 }} disabled={!done} onClick={() => actions.clearDoneShop()}>
          담은 것 지우기
        </button>
        <button className={btnPrimary} style={{ opacity: done ? 1 : 0.35 }} disabled={!done} onClick={() => actions.stockShop()}>
          냉장고에 넣기
        </button>
      </div>

      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto">
          {rows.map((it) => (
            <div key={it.id} className="flex min-h-[68px] shrink-0 items-center gap-4 rounded-2xl bg-card pl-5 pr-2.5">
              <ShopCheckRow item={it} onToggle={() => actions.toggleShop(it.id, !it.done)} />
              <button
                aria-label="삭제"
                onClick={() => actions.deleteShop(it.id)}
                className="size-12 shrink-0 rounded-xl bg-chip text-[22px] text-sub"
              >
                ✕
              </button>
            </div>
          ))}
          {rows.length === 0 && <div className="py-10 text-center text-[22px] text-sub">살 게 없어요</div>}
        </div>

        <div className="flex flex-col gap-3.5 rounded-[22px] bg-card p-[22px] lg:min-h-0">
          <div className="flex gap-2">
            <input
              className={`${inputCls} flex-1`}
              value={text}
              maxLength={50}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="품목 이름"
            />
            <button className={btnPrimary} onClick={add}>
              추가
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[20px] font-semibold">자주 사는 것</span>
            <button onClick={() => ui.openFreq()} className="h-11 rounded-xl border-[1.5px] border-line bg-transparent px-4 text-[18px]">
              관리
            </button>
          </div>
          <div className="flex flex-wrap content-start gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
          <div className="text-[17px] leading-[1.4] text-sub">냉장고에 넣을 때 여기 정해둔 보관 위치와 기한을 써요</div>
        </div>
      </div>
    </div>
  )
}
