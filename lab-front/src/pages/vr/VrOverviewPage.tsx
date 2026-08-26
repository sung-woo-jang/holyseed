import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRollover, useUpdateVrSettings, useVrCash, useVrPrice, useVrState } from '@/features/vr/api/hooks'
import { VrEngineStatusBar } from '@/features/vr/ui/VrEngineStatusBar'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { PageHeader } from '@/widgets/page-header'

const usd = (n: number | null | undefined) =>
  n === null || n === undefined
    ? '—'
    : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface CardDef {
  id: string
  label: string
  value: string
  hint?: string
  tone?: 'positive' | 'negative'
}

/** 기본 표시 순서 — 서버에 저장된 순서(state.settings.cardOrder)가 없을 때 사용 */
const ALL_CARD_IDS = [
  'initialCapital',
  'investedPrincipal',
  'costBasis',
  'marketValue',
  'unrealizedProfit',
  'totalAssets',
  'profit',
  'profitRate',
  'pool',
  'cashBalance',
  'cashRatio',
  'quantity',
  'vValue',
  'growthRate',
  'minBand',
  'maxBand',
  'avgPrice',
  'depositAmount',
  'gFactor',
]

function SortableStatCard({ card }: { card: CardDef }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="bg-card relative rounded-lg border p-4">
      <button
        type="button"
        className="text-muted-foreground absolute top-2 right-2 cursor-grab touch-none active:cursor-grabbing"
        aria-label="카드 순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <p className="text-muted-foreground pr-5 text-xs">{card.label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          card.tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          card.tone === 'negative' && 'text-red-600 dark:text-red-400'
        )}
      >
        {card.value}
      </p>
      {card.hint && <p className="text-muted-foreground mt-0.5 text-xs">{card.hint}</p>}
    </div>
  )
}

export default function VrOverviewPage() {
  const { data: res, isLoading } = useVrState()
  const { data: priceRes } = useVrPrice()
  const { data: cashRes } = useVrCash()
  const rollover = useRollover()
  const updateSettings = useUpdateVrSettings()

  const state = res?.data
  const price = priceRes?.data?.price ?? null
  const vrCash = cashRes?.data?.vrCash ?? null
  const cashDiff = state && vrCash !== null ? vrCash - state.pool : null
  const growthRate =
    state && state.v2Preview !== null && state.vValue > 0
      ? ((state.v2Preview - state.vValue) / state.vValue) * 100
      : null
  const marketValue = state && price !== null ? state.quantity * price : null
  const costBasis = state ? state.avgPrice * state.quantity : null
  const unrealizedProfit = marketValue !== null && costBasis !== null ? marketValue - costBasis : null
  const totalAssets = state && marketValue !== null ? state.pool + marketValue : null
  const profit = state && totalAssets !== null ? totalAssets - state.investedPrincipal : null
  const profitRate = profit !== null && state && state.investedPrincipal > 0 ? (profit / state.investedPrincipal) * 100 : null
  const cashRatio = state && totalAssets !== null && totalAssets > 0 ? (state.pool / totalAssets) * 100 : null

  const cards = useMemo<CardDef[]>(() => {
    if (!state) return []
    return [
      {
        id: 'initialCapital',
        label: '초기 투입금액',
        value: usd(state.initialCapital),
        hint: '최초 입금액 (2026-06-03)',
      },
      {
        id: 'investedPrincipal',
        label: '투자원금',
        value: usd(state.investedPrincipal),
        hint: '누적 입금액 (최초 입금 + 적립금 전체)',
      },
      {
        id: 'costBasis',
        label: '매수원가',
        value: costBasis !== null ? usd(costBasis) : '—',
        hint: '평단 × 보유수량 (현재 보유분에 들어간 돈)',
      },
      {
        id: 'marketValue',
        label: '평가금',
        value: marketValue !== null ? usd(marketValue) : '조회 중…',
        hint: price !== null ? `${state.quantity}주 × ${usd(price)}` : undefined,
      },
      {
        id: 'unrealizedProfit',
        label: '미실현손익',
        value: unrealizedProfit !== null ? `${unrealizedProfit >= 0 ? '+' : ''}${usd(unrealizedProfit)}` : '—',
        hint: '평가금 − 매수원가 (주식 자체의 평가차익)',
        tone: unrealizedProfit === null ? undefined : unrealizedProfit >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'totalAssets',
        label: '총자산',
        value: totalAssets !== null ? usd(totalAssets) : '—',
        hint: 'Pool + 평가금 (지금 내 전체 자산)',
      },
      {
        id: 'profit',
        label: '총손익',
        value: profit !== null ? `${profit >= 0 ? '+' : ''}${usd(profit)}` : '—',
        hint:
          profit !== null && state.investedPrincipal > 0
            ? `${((profit / state.investedPrincipal) * 100).toFixed(2)}% (총자산 − 투자원금)`
            : undefined,
        tone: profit === null ? undefined : profit >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'profitRate',
        label: '수익률',
        value: profitRate !== null ? `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%` : '—',
        hint: '수익금 ÷ 투자원금 (총자산 기준 수익률)',
        tone: profitRate === null ? undefined : profitRate >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'pool',
        label: 'Pool',
        value: usd(state.pool),
        hint: `사용가능 (${state.settings.poolLimitPct}%) ${usd(state.usablePool)}`,
      },
      {
        id: 'cashBalance',
        label: '예수금 차이',
        value: cashDiff !== null ? `${cashDiff >= 0 ? '+' : ''}${usd(cashDiff)}` : vrCash === null ? '조회 중…' : '—',
        hint: vrCash !== null ? `실제 ${usd(vrCash)} / 있어야 할 ${usd(state.pool)}` : undefined,
        tone: cashDiff === null ? undefined : cashDiff >= 0 ? 'positive' : 'negative',
      },
      {
        id: 'cashRatio',
        label: '현금 비중',
        value: cashRatio !== null ? `${cashRatio.toFixed(1)}%` : '조회 중…',
        hint: totalAssets !== null ? `Pool ${usd(state.pool)} / 총자산 ${usd(totalAssets)}` : undefined,
      },
      { id: 'quantity', label: '보유수량', value: `${state.quantity}주` },
      { id: 'vValue', label: 'V', value: usd(state.vValue), hint: `V₂ 예정 ${usd(state.v2Preview)}` },
      {
        id: 'growthRate',
        label: '상승률',
        value: growthRate !== null ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(2)}%` : '—',
        hint: state.v2Preview !== null ? `V ${usd(state.vValue)} → V₂ ${usd(state.v2Preview)}` : undefined,
        tone: growthRate === null ? undefined : growthRate >= 0 ? 'positive' : 'negative',
      },
      { id: 'minBand', label: '최소 밴드 (V×0.85)', value: usd(state.minBand) },
      { id: 'maxBand', label: '최대 밴드 (V×1.15)', value: usd(state.maxBand) },
      { id: 'avgPrice', label: '평단 (기록용)', value: usd(state.avgPrice) },
      { id: 'depositAmount', label: '적립금 / 사이클', value: usd(state.settings.depositAmount) },
      { id: 'gFactor', label: 'G (기울기)', value: String(state.settings.gFactor) },
    ]
  }, [
    state,
    price,
    vrCash,
    cashDiff,
    growthRate,
    marketValue,
    costBasis,
    unrealizedProfit,
    totalAssets,
    profit,
    profitRate,
    cashRatio,
  ])

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  const [order, setOrder] = useState<string[]>(ALL_CARD_IDS)
  const appliedServerOrderKey = useRef<string | null>(null)

  useEffect(() => {
    const saved = state?.settings.cardOrder
    const key = saved && saved.length ? saved.join(',') : null
    if (key === appliedServerOrderKey.current) return
    appliedServerOrderKey.current = key

    if (saved && saved.length) {
      const known = new Set(ALL_CARD_IDS)
      const filtered = saved.filter((id) => known.has(id))
      const missing = ALL_CARD_IDS.filter((id) => !filtered.includes(id))
      setOrder([...filtered, ...missing])
    } else {
      setOrder(ALL_CARD_IDS)
    }
  }, [state?.settings.cardOrder])

  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const appliedHiddenKey = useRef<string | null>(null)

  useEffect(() => {
    const saved = state?.settings.hiddenCards
    const key = saved && saved.length ? [...saved].sort().join(',') : ''
    if (key === appliedHiddenKey.current) return
    appliedHiddenKey.current = key
    setHidden(new Set(saved ?? []))
  }, [state?.settings.hiddenCards])

  function toggleCardVisibility(id: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      updateSettings.mutate({ hiddenCards: Array.from(next) })
      return next
    })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id))
      const newIndex = prev.indexOf(String(over.id))
      const next = arrayMove(prev, oldIndex, newIndex)
      updateSettings.mutate({ cardOrder: next })
      return next
    })
  }

  async function handleRolloverConfirm() {
    try {
      await rollover.mutateAsync({})
      toast.success('V 갱신 완료 — 새 사이클이 시작되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'V 갱신에 실패했습니다.')
    }
  }

  if (isLoading) return <div className="text-muted-foreground p-6 text-sm">불러오는 중…</div>

  const visibleOrder = order.filter((id) => !hidden.has(id))

  return (
    <div className="p-6">
      <PageHeader
        title="TQQQ VR 개요"
        description={
          state?.cycle
            ? `사이클 ${state.cycle.cycleNo} (${state.cycle.startDate} ~ ${state.cycle.endDate}) · 다음 V 갱신일 ${state.nextRenewalDate}`
            : '진행 중인 사이클이 없습니다. 체결·사이클 탭에서 사이클을 등록하세요.'
        }
        action={
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" aria-label="카드 표시 설정">
                  <Settings2 className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <p className="mb-2 text-sm font-medium">카드 표시 설정</p>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {ALL_CARD_IDS.map((id) => {
                    const card = cardMap.get(id)
                    if (!card) return null
                    return (
                      <label key={id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={!hidden.has(id)} onCheckedChange={() => toggleCardVisibility(id)} />
                        {card.label}
                      </label>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
            {state?.cycle && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={rollover.isPending}>V 갱신 실행</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>V 갱신을 실행할까요?</AlertDialogTitle>
                    <AlertDialogDescription>
                      현재 사이클 {state.cycle.cycleNo}을 종료하고 V₂ = {usd(state.v2Preview)} 로 새 사이클을
                      시작합니다. 적립금 {usd(state.settings.depositAmount)}이 Pool에 반영됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRolloverConfirm}>갱신 실행</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        }
      />

      <div className="mt-4">
        <VrEngineStatusBar />
      </div>

      {state && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {visibleOrder.map((id) => {
                  const card = cardMap.get(id)
                  return card ? <SortableStatCard key={id} card={card} /> : null
                })}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-muted-foreground mt-3 text-xs">
            현재 {state.settings.symbol} 가격 {price !== null ? usd(price) : '조회 중…'} (60초 자동 갱신) · 평가금 &lt;{' '}
            {usd(state.minBand)} → 매수 · 평가금 &gt; {usd(state.maxBand)} → 매도 · 그 외 홀딩 (평단은 판단에 사용하지
            않음) · 카드 우측 상단 손잡이를 드래그하면 순서를, 헤더의 톱니바퀴 버튼으로 표시 여부를 바꿀 수 있어요
          </p>
        </>
      )}
    </div>
  )
}
