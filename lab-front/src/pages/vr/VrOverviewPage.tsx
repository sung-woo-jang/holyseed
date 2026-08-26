import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Info, Settings2 } from 'lucide-react'
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
  description: string
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
  'poolUsageRate',
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
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground absolute top-2 left-2"
            aria-label={`${card.label} 설명 보기`}
          >
            <Info className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 text-sm">
          <p className="mb-1 font-medium">{card.label}</p>
          <p className="text-muted-foreground">{card.description}</p>
        </PopoverContent>
      </Popover>
      <p className="text-muted-foreground px-5 text-xs">{card.label}</p>
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
  const poolUsageRate =
    state && state.cycle && state.cycle.poolStart > 0
      ? ((state.cycle.poolStart - state.pool) / state.cycle.poolStart) * 100
      : null

  const cards = useMemo<CardDef[]>(() => {
    if (!state) return []
    return [
      {
        id: 'initialCapital',
        label: '초기 투입금액',
        value: usd(state.initialCapital),
        hint: '최초 입금액 (2026-06-03)',
        description: '이 VR 계좌를 처음 개설하면서 넣은 원금이에요. 이후 사이클마다 들어오는 적립금은 포함하지 않아요.',
      },
      {
        id: 'investedPrincipal',
        label: '투자원금',
        value: usd(state.investedPrincipal),
        hint: '누적 입금액 (최초 입금 + 적립금 전체)',
        description:
          '지금까지 이 계좌에 넣은 돈의 총합이에요(최초 입금 + 사이클마다의 적립금 전체). 총손익·수익률을 계산할 때 기준이 되는 분모예요.',
      },
      {
        id: 'costBasis',
        label: '매수원가',
        value: costBasis !== null ? usd(costBasis) : '—',
        hint: '평단 × 보유수량 (현재 보유분에 들어간 돈)',
        description:
          '평단 × 보유수량. 지금 갖고 있는 주식을 사는 데 실제로 들어간 돈이에요. 이미 매도한 주식의 원가는 빠지고, 지금 보유 중인 분에 대한 원가만 남아요.',
      },
      {
        id: 'marketValue',
        label: '평가금',
        value: marketValue !== null ? usd(marketValue) : '조회 중…',
        hint: price !== null ? `${state.quantity}주 × ${usd(price)}` : undefined,
        description:
          '보유수량 × 현재가. 지금 갖고 있는 주식을 지금 가격에 팔면 얼마인지예요. VR의 매수/매도 판단(밴드와 비교)이 바로 이 값을 기준으로 이뤄져요.',
      },
      {
        id: 'unrealizedProfit',
        label: '미실현손익',
        value: unrealizedProfit !== null ? `${unrealizedProfit >= 0 ? '+' : ''}${usd(unrealizedProfit)}` : '—',
        hint: '평가금 − 매수원가 (주식 자체의 평가차익)',
        tone: unrealizedProfit === null ? undefined : unrealizedProfit >= 0 ? 'positive' : 'negative',
        description:
          '평가금 − 매수원가. 아직 팔지 않은 주식에서 지금까지 난 평가상의 손익이에요. 실제로 매도하기 전까지는 확정된 손익이 아니라 시세에 따라 계속 바뀌어요.',
      },
      {
        id: 'totalAssets',
        label: '총자산',
        value: totalAssets !== null ? usd(totalAssets) : '—',
        hint: 'Pool + 평가금 (지금 내 전체 자산)',
        description: 'Pool(현금) + 평가금(주식 평가액). 지금 이 VR 계좌 전체의 가치예요.',
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
        description:
          '총자산 − 투자원금. 지금까지 넣은 돈 대비 계좌 전체가 얼마나 불었는지(줄었는지)를 금액으로 보여줘요. 실현손익과 미실현손익을 모두 포함한 값이에요.',
      },
      {
        id: 'profitRate',
        label: '수익률',
        value: profitRate !== null ? `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%` : '—',
        hint: '수익금 ÷ 투자원금 (총자산 기준 수익률)',
        tone: profitRate === null ? undefined : profitRate >= 0 ? 'positive' : 'negative',
        description: '총손익 ÷ 투자원금 × 100. "총손익" 카드와 같은 값을 퍼센트로 환산한 거예요(총손익 hint에도 같은 값이 나와요).',
      },
      {
        id: 'pool',
        label: 'Pool',
        value: usd(state.pool),
        hint: `사용가능 (${state.settings.poolLimitPct}%) ${usd(state.usablePool)}`,
        description:
          '방법론상 "Pool"은 보유 중인 현금을 뜻해요. 매수가 일어나면 줄고, 매도나 적립금이 들어오면 늘어요. V값 상승률을 결정하는 요소 중 하나이기도 해요(V₂ = V₁ + Pool/G + 적립금). hint의 "사용가능"은 한 번의 매수에 쓸 수 있는 상한선(Pool × 75%)이에요.',
      },
      {
        id: 'poolUsageRate',
        label: 'Pool 소진율',
        value: poolUsageRate !== null ? `${poolUsageRate.toFixed(1)}%` : '—',
        hint: state.cycle ? `사이클 시작 ${usd(state.cycle.poolStart)} → 현재 ${usd(state.pool)}` : '진행 중인 사이클 없음',
        tone: poolUsageRate === null || poolUsageRate === 0 ? undefined : poolUsageRate > 0 ? 'negative' : 'positive',
        description:
          '이번 사이클이 시작될 때의 Pool 대비, 지금까지 매수로 얼마나 빠져나갔는지의 비율이에요. Pool 카드의 "사용가능 75%"(한 번의 매수에 쓸 수 있는 상한선)와는 다른 개념이니 헷갈리지 마세요 — 이건 사이클 누적 기준이고, 75%는 매수 1건마다 매번 새로 계산되는 한도예요.',
      },
      {
        id: 'cashBalance',
        label: '예수금 차이',
        value: cashDiff !== null ? `${cashDiff >= 0 ? '+' : ''}${usd(cashDiff)}` : vrCash === null ? '조회 중…' : '—',
        hint: vrCash !== null ? `실제 ${usd(vrCash)} / 있어야 할 ${usd(state.pool)}` : undefined,
        tone: cashDiff === null ? undefined : cashDiff >= 0 ? 'positive' : 'negative',
        description:
          '실제 토스 계좌 예수금 − VR이 계산한 Pool. 이 계좌는 무한매수법(라오퍼스)과 같이 쓰고 있어서 실제 예수금에는 라오퍼스 쪽 현금도 섞여 있어요. 그 차이를 보여주는 카드예요.',
      },
      {
        id: 'cashRatio',
        label: '현금 비중',
        value: cashRatio !== null ? `${cashRatio.toFixed(1)}%` : '조회 중…',
        hint: totalAssets !== null ? `Pool ${usd(state.pool)} / 총자산 ${usd(totalAssets)}` : undefined,
        description:
          'Pool ÷ 총자산 × 100. 전체 자산 중 현금으로 들고 있는 비중이에요. 상승장이 이어지면 매도가 잦아지면서 이 비중이 계속 올라가는 게 VR 전략의 자연스러운 특징이에요.',
      },
      {
        id: 'quantity',
        label: '보유수량',
        value: `${state.quantity}주`,
        description: '지금 보유 중인 TQQQ 주식 수예요.',
      },
      {
        id: 'vValue',
        label: 'V',
        value: usd(state.vValue),
        hint: `V₂ 예정 ${usd(state.v2Preview)}`,
        description:
          'Value의 약자로, 평가금이 어떤 흐름으로 가야 하는지 가이드하는 목표값이에요. 최소/최대 밴드를 결정하는 기준이 되고, 2주(한 사이클)마다 V₂ = V₁ + Pool/G + 적립금 공식으로 갱신돼요.',
      },
      {
        id: 'growthRate',
        label: '상승률',
        value: growthRate !== null ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(2)}%` : '—',
        hint: state.v2Preview !== null ? `V ${usd(state.vValue)} → V₂ ${usd(state.v2Preview)}` : undefined,
        tone: growthRate === null ? undefined : growthRate >= 0 ? 'positive' : 'negative',
        description:
          '다음 사이클의 V(V₂)가 지금 V보다 몇 % 높은지예요. G값이 클수록 이 상승률이 낮아지고(더 안정적), G값이 작을수록 높아져요(더 공격적).',
      },
      {
        id: 'minBand',
        label: '최소 밴드 (V×0.85)',
        value: usd(state.minBand),
        description: 'V × 0.85. 평가금이 이 아래로 내려가면 매수 신호예요.',
      },
      {
        id: 'maxBand',
        label: '최대 밴드 (V×1.15)',
        value: usd(state.maxBand),
        description: 'V × 1.15. 평가금이 이 위로 올라가면 매도 신호예요.',
      },
      {
        id: 'avgPrice',
        label: '평단 (기록용)',
        value: usd(state.avgPrice),
        description: '보유 주식의 평균 매수가예요. 매수/매도 판단에는 쓰이지 않고(밴드만 기준), 기록·손익 계산용으로만 쓰여요.',
      },
      {
        id: 'depositAmount',
        label: '적립금 / 사이클',
        value: usd(state.settings.depositAmount),
        description: '사이클이 갱신될 때마다 Pool에 추가로 넣기로 설정한 금액이에요. V값 갱신 공식에도 그대로 더해져요.',
      },
      {
        id: 'gFactor',
        label: 'G (기울기)',
        value: String(state.settings.gFactor),
        description:
          'Gradient(기울기)의 약자로, V가 얼마나 가파르게 오르도록 할지 조절하는 값이에요. 클수록 상승률이 낮아지고 Pool을 더 많이 보유하게 돼서 안정적이고, 작을수록 더 공격적으로 운용돼요.',
      },
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
    poolUsageRate,
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
            않음) · 카드 우측 상단 손잡이를 드래그하면 순서를, 헤더의 톱니바퀴 버튼으로 표시 여부를 바꿀 수 있어요 · 좌측
            상단 ⓘ를 누르면 카드 설명을 볼 수 있어요
          </p>
        </>
      )}
    </div>
  )
}
