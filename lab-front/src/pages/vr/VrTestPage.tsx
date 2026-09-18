import type { ReactNode } from 'react'
import { PageHeader } from '@/widgets/page-header'
import { useVrCycles, useVrWealthHistory, useVrSpyComparison } from '@/features/vr/api/hooks'
import { CumulativeBandChart, WealthVsPrincipalChart, SpyComparisonChart } from '@/features/vr/ui/VrPerformanceCharts'

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatTile({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {sub && <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {children}
    </div>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-xs text-muted-foreground">{children}</p>
}

export default function VrTestPage() {
  const { data: cyclesRes } = useVrCycles()
  const { data: wealthRes } = useVrWealthHistory()
  const { data: spyRes } = useVrSpyComparison()
  const cycles = (cyclesRes?.data ?? []).slice().sort((a, b) => a.cycleNo - b.cycleNo)
  const wealth = wealthRes?.data ?? []
  const spy = spyRes?.data ?? []

  const firstCycle = cycles[0]
  const lastCycle = cycles[cycles.length - 1]
  const lastWealth = wealth[wealth.length - 1]
  const vGrowthPct = firstCycle && lastCycle ? ((lastCycle.vValue / firstCycle.vValue - 1) * 100).toFixed(1) : null

  return (
    <div className="p-6">
      <PageHeader title="테스트" description="누적 성과 실험 페이지 — 사이클을 이어붙인 장기 추이 · 평가금 vs 투자원금 · SPY 대비 수익률" />

      {/* 사이클 누적 V/밴드 */}
      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">사이클 누적 V값 · 밴드</h3>
        {cycles.length >= 2 ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatTile label="진행 사이클" value={`${lastCycle.cycleNo}회차${lastCycle.isClosed ? '' : ' (진행중)'}`} />
              <StatTile label="V값 (시작 → 현재)" value={`${firstCycle.vValue.toFixed(0)} → ${lastCycle.vValue.toFixed(0)}`} />
              <StatTile label="V값 성장률" value={vGrowthPct !== null ? `+${vGrowthPct}%` : '—'} positive />
              <StatTile label="현재 Pool" value={usd(lastCycle.poolEnd ?? lastCycle.poolStart)} />
              <StatTile label="누적 적립금" value={usd(cycles.reduce((s, c) => s + c.depositAmount, 0))} />
            </div>
            <ChartCard title="V값 · 최소/최대 밴드 추이" sub={`${firstCycle.startDate} ~ ${lastCycle.endDate} (${cycles.length}사이클)`}>
              <CumulativeBandChart cycles={cycles} />
            </ChartCard>
          </>
        ) : (
          <EmptyNote>사이클이 2개 이상 쌓이면 누적 추이 그래프가 나타납니다.</EmptyNote>
        )}
      </section>

      {/* 평가금 vs 투자원금 */}
      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">평가금 · 투자원금 추이</h3>
        {wealth.length >= 2 ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="TQQQ 평가금 (오늘)" value={usd(lastWealth.tqqqValue)} />
              <StatTile label="누적 투자원금" value={usd(lastWealth.cumulativePrincipal)} />
              <StatTile
                label="평가손익"
                value={`${lastWealth.tqqqValue - lastWealth.cumulativePrincipal >= 0 ? '+' : ''}${usd(lastWealth.tqqqValue - lastWealth.cumulativePrincipal)}`}
                positive={lastWealth.tqqqValue - lastWealth.cumulativePrincipal >= 0}
              />
              <StatTile label="데이터 축적" value={`${wealth.length}일치`} />
            </div>
            <ChartCard title="TQQQ 평가금 vs 누적 투자원금" sub={`실계좌 일별 스냅샷 · ${wealth[0].date} ~ ${lastWealth.date}`}>
              <WealthVsPrincipalChart points={wealth} />
            </ChartCard>
          </>
        ) : (
          <EmptyNote>
            매일 06:00 KST 자산 스냅샷이 쌓이는 중입니다 — 이틀 치 이상 모이면 그래프가 나타납니다.
          </EmptyNote>
        )}
      </section>

      {/* SPY 비교 */}
      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">베타(SPY) 대비 비교</h3>
        {spy.length >= 2 ? (
          <ChartCard title="TQQQ 평가금 vs SPY (정규화 수익률 %)" sub={`첫 공통일(${spy[0].date})을 0%로 정규화 · Pool(현금)은 미포함, 보유주식 평가금만 비교`}>
            <SpyComparisonChart points={spy} />
          </ChartCard>
        ) : (
          <EmptyNote>
            SPY 가격은 매일 06:10 KST에 자동 수집됩니다 — 자산 스냅샷과 겹치는 날짜가 이틀 이상 쌓이면 비교 그래프가 나타납니다.
          </EmptyNote>
        )}
      </section>
    </div>
  )
}
