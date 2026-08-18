import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { GripVertical } from 'lucide-react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
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
import { useRollover, useUpdateVrSettings, useVrPrice, useVrState } from '@/features/vr/api/hooks'
import { VrEngineStatusBar } from '@/features/vr/ui/VrEngineStatusBar'

const usd = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface CardDef {
  id: string
  label: string
  value: string
  hint?: string
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
  'pool',
  'quantity',
  'vValue',
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
    <div ref={setNodeRef} style={style} className="relative rounded-lg border bg-card p-4">
      <button
        type="button"
        className="absolute right-2 top-2 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="카드 순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <p className="pr-5 text-xs text-muted-foreground">{card.label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{card.value}</p>
      {card.hint && <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>}
    </div>
  )
}

export default function VrOverviewPage() {
  const { data: res, isLoading } = useVrState()
  const { data: priceRes } = useVrPrice()
  const rollover = useRollover()
  const updateSettings = useUpdateVrSettings()

  const state = res?.data
  const price = priceRes?.data?.price ?? null
  const marketValue = state && price !== null ? state.quantity * price : null
  const costBasis = state ? state.avgPrice * state.quantity : null
  const unrealizedProfit = marketValue !== null && costBasis !== null ? marketValue - costBasis : null
  const totalAssets = state && marketValue !== null ? state.pool + marketValue : null
  const profit = state && totalAssets !== null ? totalAssets - state.investedPrincipal : null

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
      },
      {
        id: 'pool',
        label: 'Pool',
        value: usd(state.pool),
        hint: `사용가능 (${state.settings.poolLimitPct}%) ${usd(state.usablePool)}`,
      },
      { id: 'quantity', label: '보유수량', value: `${state.quantity}주` },
      { id: 'vValue', label: 'V', value: usd(state.vValue), hint: `V₂ 예정 ${usd(state.v2Preview)}` },
      { id: 'minBand', label: '최소 밴드 (V×0.85)', value: usd(state.minBand) },
      { id: 'maxBand', label: '최대 밴드 (V×1.15)', value: usd(state.maxBand) },
      { id: 'avgPrice', label: '평단 (기록용)', value: usd(state.avgPrice) },
      { id: 'depositAmount', label: '적립금 / 사이클', value: usd(state.settings.depositAmount) },
      { id: 'gFactor', label: 'G (기울기)', value: String(state.settings.gFactor) },
    ]
  }, [state, price, marketValue, costBasis, unrealizedProfit, totalAssets, profit])

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

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">불러오는 중…</div>

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
          state?.cycle && (
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
          )
        }
      />

      <div className="mt-4">
        <VrEngineStatusBar />
      </div>

      {state && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={rectSortingStrategy}>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {order.map((id) => {
                  const card = cardMap.get(id)
                  return card ? <SortableStatCard key={id} card={card} /> : null
                })}
              </div>
            </SortableContext>
          </DndContext>

          <p className="mt-3 text-xs text-muted-foreground">
            현재 {state.settings.symbol} 가격 {price !== null ? usd(price) : '조회 중…'} (60초 자동 갱신) · 평가금 &lt;{' '}
            {usd(state.minBand)} → 매수 · 평가금 &gt; {usd(state.maxBand)} → 매도 · 그 외 홀딩 (평단은 판단에 사용하지
            않음) · 카드 우측 상단 손잡이를 드래그하면 순서를 바꿀 수 있어요
          </p>
        </>
      )}
    </div>
  )
}
