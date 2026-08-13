import { toast } from 'sonner'
import { PageHeader } from '@/widgets/page-header'
import { Badge } from '@/shared/ui/badge'
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
import { useRollover, useVrPrice, useVrState } from '@/features/vr/api/hooks'
import { VrEngineStatusBar } from '@/features/vr/ui/VrEngineStatusBar'

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
  const { data: priceRes } = useVrPrice()
  const rollover = useRollover()

  const state = res?.data
  const price = priceRes?.data?.price ?? null
  const marketValue = state && price !== null ? state.quantity * price : null
  const profit = state && marketValue !== null ? marketValue - state.investedPrincipal : null

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

      <div className="mt-4">
        <VrEngineStatusBar />
      </div>

      {state && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="투자원금" value={usd(state.investedPrincipal)} hint="누적 입금액 (최초 입금 + 적립금)" />
            <StatCard
              label="평가금"
              value={marketValue !== null ? usd(marketValue) : '조회 중…'}
              hint={price !== null ? `${state.quantity}주 × ${usd(price)}` : undefined}
            />
            <StatCard
              label="손익"
              value={profit !== null ? `${profit >= 0 ? '+' : ''}${usd(profit)}` : '—'}
              hint={
                profit !== null && state.investedPrincipal > 0
                  ? `${((profit / state.investedPrincipal) * 100).toFixed(2)}%`
                  : undefined
              }
            />
            {verdict && (
              <div className="flex items-center rounded-lg border bg-card p-4">
                <Badge variant={verdict.variant} className="text-sm">
                  {verdict.label}
                </Badge>
              </div>
            )}
          </div>

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

          <p className="mt-3 text-xs text-muted-foreground">
            현재 {state.settings.symbol} 가격 {price !== null ? usd(price) : '조회 중…'} (60초 자동 갱신) · 평가금 &lt;{' '}
            {usd(state.minBand)} → 매수 · 평가금 &gt; {usd(state.maxBand)} → 매도 · 그 외 홀딩 (평단은 판단에 사용하지
            않음)
          </p>
        </>
      )}
    </div>
  )
}
