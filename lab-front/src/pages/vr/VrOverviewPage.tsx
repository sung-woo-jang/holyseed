import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/widgets/page-header'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
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
import { useRollover, useVrState } from '@/features/vr/api/hooks'

const usd = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default function VrOverviewPage() {
  const { data: res, isLoading } = useVrState()
  const rollover = useRollover()
  const [currentPrice, setCurrentPrice] = useState('')

  const state = res?.data
  const price = parseFloat(currentPrice)
  const marketValue = state && !isNaN(price) ? state.quantity * price : null

  let verdict: { label: string; variant: 'default' | 'destructive' | 'secondary' } | null = null
  if (state && marketValue !== null && state.vValue > 0) {
    if (marketValue < state.minBand) verdict = { label: '매수 발동', variant: 'destructive' }
    else if (marketValue > state.maxBand) verdict = { label: '매도 발동', variant: 'default' }
    else verdict = { label: '홀딩', variant: 'secondary' }
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

      {state && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="V" value={usd(state.vValue)} hint={`V₂ 예정 ${usd(state.v2Preview)}`} />
            <StatCard label="최소 밴드 (V×0.85)" value={usd(state.minBand)} />
            <StatCard label="최대 밴드 (V×1.15)" value={usd(state.maxBand)} />
            <StatCard
              label="Pool"
              value={usd(state.pool)}
              hint={`사용가능 (${state.settings.poolLimitPct}%) ${usd(state.usablePool)}`}
            />
            <StatCard label="보유수량" value={`${state.quantity}주`} />
            <StatCard label="평단 (기록용)" value={usd(state.avgPrice)} />
            <StatCard label="적립금 / 사이클" value={usd(state.settings.depositAmount)} />
            <StatCard label="G (기울기)" value={String(state.settings.gFactor)} />
          </div>

          <div className="mt-6 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">현재 {state.settings.symbol} 가격 ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  className="w-40"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="예: 71.25"
                />
              </div>
              {marketValue !== null && (
                <div className="flex items-center gap-3 pb-1">
                  <span className="text-sm text-muted-foreground">
                    평가금 = {state.quantity}주 × {usd(price)} = <b className="tabular-nums">{usd(marketValue)}</b>
                  </span>
                  {verdict && <Badge variant={verdict.variant}>{verdict.label}</Badge>}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              평가금 &lt; {usd(state.minBand)} → 매수 · 평가금 &gt; {usd(state.maxBand)} → 매도 · 그 외 홀딩 (평단은
              판단에 사용하지 않음)
            </p>
          </div>
        </>
      )}
    </div>
  )
}
