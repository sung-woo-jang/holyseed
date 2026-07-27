import { useMemo, useState, type ReactNode } from 'react'
import { PageHeader } from '@/widgets/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useVrCycles, useVrFills } from '@/features/vr/api/hooks'
import { AvgPriceChart, PoolChart, QuantityChart } from '@/features/vr/ui/VrTrendCharts'

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  )
}

export default function VrTrendPage() {
  const { data: cyclesRes } = useVrCycles()
  const { data: fillsRes } = useVrFills()
  const cycles = cyclesRes?.data ?? []
  const fills = fillsRes?.data ?? []

  const [selectedCycle, setSelectedCycle] = useState<number | null>(null)

  const latestCycleNo = cycles.reduce((max, c) => Math.max(max, c.cycleNo), 0)
  const activeCycleNo = selectedCycle ?? latestCycleNo
  const cycle = cycles.find((c) => c.cycleNo === activeCycleNo)

  const cycleFills = useMemo(
    () =>
      fills
        .filter((f) => f.cycleNo === activeCycleNo)
        .slice()
        .sort((a, b) => (a.fillDate < b.fillDate ? -1 : a.fillDate > b.fillDate ? 1 : a.id - b.id)),
    [fills, activeCycleNo],
  )

  if (cycles.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="사이클 추이" description="등록된 사이클이 없습니다." />
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="사이클 추이"
        description="사이클별 평단·보유수량·Pool 변화를 시간순으로 봅니다."
        action={
          <Select value={String(activeCycleNo)} onValueChange={(v) => setSelectedCycle(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cycles
                .slice()
                .sort((a, b) => b.cycleNo - a.cycleNo)
                .map((c) => (
                  <SelectItem key={c.id} value={String(c.cycleNo)}>
                    사이클 {c.cycleNo} {c.isClosed ? '' : '(진행 중)'}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        }
      />

      {cycle && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="기간" value={`${cycle.startDate} ~ ${cycle.endDate}`} />
          <StatTile label="V" value={usd(cycle.vValue)} />
          <StatTile label="Pool 시작" value={usd(cycle.poolStart)} />
          <StatTile label="Pool 종료" value={cycle.poolEnd !== null ? usd(cycle.poolEnd) : '—'} />
          <StatTile label="적립금" value={usd(cycle.depositAmount)} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="평단 추이">
          <AvgPriceChart fills={cycleFills} />
        </ChartCard>
        <ChartCard title="보유수량 추이">
          <QuantityChart fills={cycleFills} />
        </ChartCard>
        <ChartCard title="Pool 추이">
          <PoolChart fills={cycleFills} />
        </ChartCard>
      </div>
      {cycleFills.length < 2 && (
        <p className="mt-4 text-xs text-muted-foreground">체결이 2건 미만이라 그래프를 그릴 수 없습니다.</p>
      )}
    </div>
  )
}
