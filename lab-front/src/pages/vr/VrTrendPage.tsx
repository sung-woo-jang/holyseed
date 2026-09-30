import { useMemo, useState, type ReactNode } from 'react'
import { PageHeader } from '@/widgets/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useVrCycles, useVrFills, useVrWealthHistory } from '@/features/vr/api/hooks'
import { AvgPriceChart, BandChart, CumulativeChart, PoolChart, QuantityChart } from '@/features/vr/ui/VrTrendCharts'

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
  const { data: wealthRes } = useVrWealthHistory()
  const cycles = cyclesRes?.data ?? []
  const fills = fillsRes?.data ?? []
  const wealth = wealthRes?.data ?? []
  const wealthPoints = wealth.map((w) => ({ date: w.date, value: w.tqqqValue }))
  // 누적 정리 — 표와 차트 모두 같은 스냅샷 시점의 평가금·Pool·계좌총액으로 맞춘다
  const lastWealth = wealth.length > 0 ? wealth[wealth.length - 1] : null
  const cumProfit = lastWealth ? lastWealth.totalAssets - lastWealth.cumulativePrincipal : null
  const cumPct =
    lastWealth && cumProfit !== null && lastWealth.cumulativePrincipal > 0
      ? (lastWealth.totalAssets / lastWealth.cumulativePrincipal - 1) * 100
      : null
  const lastWealthDate = wealthPoints.length > 0 ? wealthPoints[wealthPoints.length - 1].date : ''
  const sortedCycles = cycles.slice().sort((a, b) => a.cycleNo - b.cycleNo)
  // 사이클별 요약(시트 위쪽 표와 같은 항목) — 말 평가금이 그 사이클 밴드 안인지도 같이 표시
  const cycleRows = sortedCycles
    .slice()
    .reverse()
    .map((c) => {
      const end = c.isClosed && c.endDate ? c.endDate : lastWealthDate
      const pts = wealthPoints.filter((p) => p.date >= c.startDate && p.date <= end)
      const lastPt = pts.length > 0 ? pts[pts.length - 1] : null
      const inside = lastPt ? lastPt.value >= c.minBand && lastPt.value <= c.maxBand : null
      return { c, lastPt, inside }
    })
  const outCount = wealthPoints.filter((p) => {
    const c = sortedCycles.filter((x) => x.startDate <= p.date).pop()
    return c ? p.value < c.minBand || p.value > c.maxBand : false
  }).length

  const [selected, setSelected] = useState<number | 'all'>('all')

  const isAll = selected === 'all'
  const latestCycleNo = cycles.reduce((max, c) => Math.max(max, c.cycleNo), 0)
  const activeCycleNo = isAll ? latestCycleNo : selected
  const cycle = cycles.find((c) => c.cycleNo === activeCycleNo)

  // 전체 보기: 입금(DEPOSIT)은 평단이 안 바뀌는 점(첫 입금은 평단 0)이라 빼고 매수/매도 체결만 이어 붙인다
  const allFills = useMemo(
    () =>
      fills
        .filter((f) => f.kind !== 'DEPOSIT')
        .slice()
        .sort((a, b) => (a.fillDate < b.fillDate ? -1 : a.fillDate > b.fillDate ? 1 : a.id - b.id)),
    [fills],
  )
  const bands = useMemo(() => {
    const groups: { cycleNo: number; from: number; to: number }[] = []
    allFills.forEach((f, i) => {
      const last = groups[groups.length - 1]
      if (last && last.cycleNo === f.cycleNo) last.to = i
      else groups.push({ cycleNo: f.cycleNo, from: i, to: i })
    })
    return groups.map((g) => ({ from: g.from, to: g.to, label: String(g.cycleNo) }))
  }, [allFills])

  const cycleFills = useMemo(
    () =>
      fills
        .filter((f) => f.cycleNo === activeCycleNo)
        .slice()
        .sort((a, b) => (a.fillDate < b.fillDate ? -1 : a.fillDate > b.fillDate ? 1 : a.id - b.id)),
    [fills, activeCycleNo],
  )

  const openCycleCount = cycles.filter((c) => !c.isClosed).length
  const hasOpenCycle = openCycleCount > 0
  const lastEndDate = cycles.reduce((m, c) => (c.endDate && c.endDate > m ? c.endDate : m), '')

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
        description="사이클별(또는 전체를 이어서) 평단·보유수량·Pool 변화를 시간순으로 봅니다."
        action={
          <Select value={isAll ? 'all' : String(activeCycleNo)} onValueChange={(v) => setSelected(v === 'all' ? 'all' : Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
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

      {isAll && lastWealth && cumProfit !== null && cumPct !== null && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <ChartCard title={`누적 정리 · ${lastWealth.date} 기준`}>
            <div className="divide-y rounded-lg border text-sm">
              {[
                { k: 'TQQQ 평가금', v: usd(lastWealth.tqqqValue) },
                { k: 'Pool', v: usd(lastWealth.pool) },
                { k: '계좌총액', v: usd(lastWealth.totalAssets), hl: true },
                { k: '투자금', v: usd(lastWealth.cumulativePrincipal) },
                { k: '수익률', v: `${cumPct >= 0 ? '+' : ''}${cumPct.toFixed(2)}%`, tone: true },
                { k: '수익금', v: `${cumProfit >= 0 ? '+' : '-'}${usd(Math.abs(cumProfit))}`, tone: true },
              ].map((row) => (
                <div key={row.k} className="flex">
                  <span className="flex-1 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">{row.k}</span>
                  <span
                    className={`flex-1 px-3 py-2 text-right font-semibold tabular-nums ${
                      row.tone ? (cumProfit < 0 ? 'text-destructive' : 'text-primary') : row.hl ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">계좌총액 = TQQQ 평가금 + Pool, 수익금 = 계좌총액 − 투자금</p>
          </ChartCard>
          <ChartCard title="계좌총액 vs 투자원금 (실선: 계좌총액 / 점선: 투자원금)">
            <CumulativeChart
              points={wealth.map((w) => ({ date: w.date, totalAssets: w.totalAssets, principal: w.cumulativePrincipal }))}
            />
          </ChartCard>
        </div>
      )}

      {isAll && wealthPoints.length > 1 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ChartCard title="평가금 vs V 밴드 (선: 일별 평가금 / 띠: 사이클별 최소~최대 밴드)">
            <BandChart cycles={cycles} points={wealthPoints} />
            <p className="mt-2 text-xs text-muted-foreground">
              {outCount === 0 ? `밴드 안 — 기록 ${wealthPoints.length}건 중 이탈 0건.` : `밴드 밖 ${outCount}건(빨간 점).`} 평가금은 계좌 스냅샷 기반이라{' '}
              {wealthPoints[0].date}부터 있습니다.
            </p>
          </ChartCard>
          <ChartCard title="사이클별 요약">
            <div className="divide-y text-xs">
              {cycleRows.map(({ c, lastPt, inside }) => (
                <div key={c.id} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      사이클 {c.cycleNo}{' '}
                      <span className="font-normal text-muted-foreground">
                        {c.startDate.slice(5)} ~ {c.endDate?.slice(5) ?? '진행 중'}
                      </span>
                    </span>
                    {inside !== null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${inside ? 'bg-primary/10 text-primary' : 'bg-destructive text-white'}`}
                      >
                        {c.isClosed ? '' : '진행 중 · '}
                        {inside ? '밴드 안' : '밴드 밖'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 leading-relaxed tabular-nums text-muted-foreground">
                    V {usd(c.vValue)} · 밴드 {usd(c.minBand)}~{usd(c.maxBand)}
                    <br />
                    Pool {usd(c.poolStart)} → {c.poolEnd !== null ? usd(c.poolEnd) : '—'} · 거래액 {usd(c.tradeAmount)}
                    {lastPt ? ` · 말 평가금 ${usd(lastPt.value)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {isAll ? (
        allFills.length < 2 ? (
          <p className="mt-6 text-xs text-muted-foreground">체결이 2건 미만이라 그래프를 그릴 수 없습니다.</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="기간" value={`${allFills[0].fillDate} ~ ${hasOpenCycle ? '진행 중' : lastEndDate}`} />
              <StatTile
                label="평단 (처음 → 지금)"
                value={`${usd(allFills[0].avgPriceAfter)} → ${usd(allFills[allFills.length - 1].avgPriceAfter)}`}
              />
              <StatTile label="보유수량" value={`${allFills[allFills.length - 1].qtyAfter}주`} />
              <StatTile label="사이클" value={`${cycles.length}개${openCycleCount > 0 ? ` (진행 중 ${openCycleCount})` : ''}`} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard title="평단 추이 · 전체 (실선 평단 / 점선 체결가)">
                <AvgPriceChart fills={allFills} bands={bands} showFillPrice />
              </ChartCard>
              <ChartCard title="보유수량 추이 · 전체">
                <QuantityChart fills={allFills} bands={bands} />
              </ChartCard>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              세로 점선은 사이클 경계(위 숫자가 사이클 번호)입니다. 입금은 빼고 매수·매도 체결만 이어 그립니다.
            </p>
          </>
        )
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
