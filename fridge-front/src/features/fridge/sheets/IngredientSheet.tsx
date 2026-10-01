import { useState } from 'react'
import type { FridgeState, Ingredient, Place } from '@/api/types'
import { Seg, Sheet, btnDanger, btnGhost, btnPrimary, inputCls } from '@/components/ui'
import { useUiStore } from '@/stores/ui.store'
import { dLabel, diffDays, fmtDate, plus, shift } from '../lib/date'
import { TONE_TEXT, expiryOf } from '../lib/expiry'
import { useFridgeActions } from '../hooks/useFridge'

export default function IngredientSheet({
  state,
  ingredient,
}: {
  state: FridgeState
  ingredient: Ingredient | null
}) {
  const close = useUiStore((s) => s.closeSheet)
  const actions = useFridgeActions()
  const isNew = !ingredient
  const [name, setName] = useState(ingredient?.name ?? '')
  const [place, setPlace] = useState<Place>(ingredient?.place ?? '냉장')
  const [exp, setExp] = useState(ingredient?.exp ?? plus(state.settings.defaultDays))
  const [busy, setBusy] = useState(false)

  const d = diffDays(exp)
  const ready = name.trim().length > 0

  const applyFreq = (f: { name: string; place: Place; days: number }) => {
    setName(f.name)
    setPlace(f.place)
    setExp(plus(f.days))
  }

  const onName = (v: string) => {
    const f = state.freq.find((x) => x.name === v.trim())
    if (f && isNew) applyFreq(f)
    else setName(v)
  }

  const save = async () => {
    if (!ready || busy) return
    setBusy(true)
    const n = name.trim()
    const body = { name: n, place, exp }
    const r = ingredient
      ? await actions.updateIngredient(ingredient.id, body, `${n} 고쳤어요`)
      : await actions.createIngredient(body, `${n} 넣었어요 · ${dLabel(d)}`)
    setBusy(false)
    if (r) close()
  }

  const remove = async () => {
    if (!ingredient) return
    close()
    await actions.deleteIngredient(ingredient.id, `${ingredient.name} 지웠어요`)
  }

  const stepBtn = 'size-[52px] shrink-0 rounded-xl bg-chip text-[26px]'

  return (
    <Sheet title={isNew ? '재료 넣기' : '재료 수정'} onClose={close}>
      {isNew && (
        <div className="flex flex-wrap gap-2">
          {state.freq.slice(0, 12).map((f) => (
            <button
              key={f.id}
              onClick={() => applyFreq(f)}
              className={`h-[46px] rounded-full px-4 text-[18px] ${name === f.name ? 'bg-ink text-bg' : 'bg-chip text-ink'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <input
        className={`${inputCls} h-[60px] text-[23px]`}
        value={name}
        maxLength={50}
        onChange={(e) => onName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="재료 이름"
      />
      <div className="flex items-center gap-3">
        <span className="w-14 text-[18px] text-sub">보관</span>
        <Seg options={[['냉장', '냉장'], ['냉동', '냉동'], ['실온', '실온']] as const} value={place} onChange={setPlace} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-14 text-[18px] text-sub">기한</span>
        <button aria-label="하루 앞당기기" className={stepBtn} onClick={() => setExp(shift(exp, -1))}>
          −
        </button>
        <div className="flex w-[150px] flex-col items-center sm:w-[190px]">
          <span className={`tnum text-[30px] font-bold ${TONE_TEXT[expiryOf(d).tone]}`}>{dLabel(d)}</span>
          <span className="text-[17px] text-sub">{fmtDate(exp)}</span>
        </div>
        <button aria-label="하루 늘리기" className={stepBtn} onClick={() => setExp(shift(exp, 1))}>
          +
        </button>
        <div className="flex gap-1.5 sm:ml-auto">
          {[3, 7, 14, 30].map((n) => (
            <button
              key={n}
              onClick={() => setExp(plus(n))}
              className="h-12 rounded-xl border-[1.5px] border-line bg-transparent px-3 text-[18px]"
            >
              {n}일
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex gap-2.5">
        {ingredient && (
          <button className={btnDanger} onClick={remove}>
            삭제
          </button>
        )}
        <span className="flex-1" />
        <button className={btnGhost} onClick={close}>
          취소
        </button>
        <button className={`${btnPrimary} px-[30px]`} disabled={!ready || busy} onClick={save}>
          {isNew ? '넣기' : '저장'}
        </button>
      </div>
    </Sheet>
  )
}
