import { useMemo, useState } from 'react'
import { simulateShannonDemon, computeBuyAndHold } from '@holyseed/shannon-core'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tile } from '@/features/quant/ui/ui'
import { useContainerWidth } from '@/shared/hooks/use-container-width'
import { useBacktestPrices } from '@/features/backtest/api/hooks'
import { BACKTEST_SYMBOLS, type BacktestSymbol } from '@/features/backtest/api/types'
import { BacktestChart, type BacktestChartPoint } from '@/features/backtest/ui/BacktestChart'

const usd = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

interface RunResult {
  points: BacktestChartPoint[]
  finalValue: number
  totalReturnPct: number
  rebalanceCount: number
  totalFeesPaid: number
  buyHoldFinalValue: number
  buyHoldReturnPct: number
  dataFrom: string
  dataTo: string
}

const YEAR_OPTIONS = ['1', '3', '5', '10', '15']

export default function ShannonDemonBacktestPage() {
  const { ref: chartAreaRef, width: chartWidth } = useContainerWidth<HTMLDivElement>(720)
  const fetchPrices = useBacktestPrices()

  const [symbol, setSymbol] = useState<BacktestSymbol>('TQQQ')
  const [yearsBySymbol, setYearsBySymbol] = useState<Record<string, string>>({})
  const years = yearsBySymbol[symbol] ?? '10'
  const setYears = (v: string) => setYearsBySymbol((prev) => ({ ...prev, [symbol]: v }))

  const [targetStockPct, setTargetStockPct] = useState(50)
  const [thresholdPct, setThresholdPct] = useState('5')
  const [initialCapital, setInitialCapital] = useState('10000')
  const [feePct, setFeePct] = useState('0.1')
  const [untilDate, setUntilDate] = useState('')

  const [result, setResult] = useState<RunResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setError(null)
    try {
      const res = await fetchPrices.mutateAsync({ symbol, years: Number(years), untilDate: untilDate || undefined })
      const prices = res.data ?? []
      if (prices.length < 2) {
        setError('가격 데이터가 부족합니다.')
        return
      }

      const capital = parseFloat(initialCapital)
      const fee = parseFloat(feePct) || 0
      const sim = simulateShannonDemon(prices, {
        targetStockPct,
        thresholdPct: parseFloat(thresholdPct),
        initialCapital: capital,
        feePct: fee,
      })
      const buyHold = computeBuyAndHold(prices, capital, fee)

      const points: BacktestChartPoint[] = sim.timeline.map((d, i) => ({
        date: d.date,
        strategyValue: d.totalValue,
        buyHoldValue: buyHold[i].totalValue,
      }))

      const buyHoldFinalValue = buyHold[buyHold.length - 1].totalValue
      setResult({
        points,
        finalValue: sim.finalValue,
        totalReturnPct: sim.totalReturnPct,
        rebalanceCount: sim.rebalanceCount,
        totalFeesPaid: sim.totalFeesPaid,
        buyHoldFinalValue,
        buyHoldReturnPct: ((buyHoldFinalValue - capital) / capital) * 100,
        dataFrom: prices[0].date,
        dataTo: prices[prices.length - 1].date,
      })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? '백테스트 실행에 실패했습니다.')
    }
  }

  const excessReturnPct = useMemo(
    () => (result ? result.totalReturnPct - result.buyHoldReturnPct : null),
    [result]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="섀넌의 도깨비 백테스트"
        description="주식:현금을 목표 비율로 유지하다가 비중이 임계값을 벗어나면 리밸런싱하는 전략을 실제 과거 가격으로 시뮬레이션합니다."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleRun()
        }}
      >
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 lg:grid-cols-7">
          <div className="space-y-2">
            <Label>종목</Label>
            <Select value={symbol} onValueChange={(v) => setSymbol(v as BacktestSymbol)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKTEST_SYMBOLS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>기간</Label>
            <Select value={years} onValueChange={setYears}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>종료일 (비우면 오늘)</Label>
            <Input type="date" value={untilDate} onChange={(e) => setUntilDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>목표 주식비중 — {targetStockPct}%</Label>
            <input
              type="range"
              min={0}
              max={100}
              value={targetStockPct}
              onChange={(e) => setTargetStockPct(Number(e.target.value))}
              className="mt-2.5 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>리밸런싱 임계값 (±%p)</Label>
            <Input type="number" min="0" step="0.5" value={thresholdPct} onChange={(e) => setThresholdPct(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>거래 수수료 (%)</Label>
            <Input type="number" min="0" step="0.01" value={feePct} onChange={(e) => setFeePct(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>초기자본 ($)</Label>
            <Input type="number" min="0" step="100" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <Button type="submit" disabled={fetchPrices.isPending}>
            {fetchPrices.isPending ? '가격 데이터 조회 중…' : '백테스트 실행'}
          </Button>
          {error && <span className="ml-3 text-sm text-destructive">{error}</span>}
        </div>
      </form>

      {result && (
        <>
          <div className="mt-6 text-xs text-muted-foreground">
            실제 데이터 구간: {result.dataFrom} ~ {result.dataTo}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Tile
              label="최종 자산 (섀넌의 도깨비)"
              value={usd(result.finalValue)}
              sub={`${result.totalReturnPct >= 0 ? '+' : ''}${result.totalReturnPct.toFixed(1)}%`}
            />
            <Tile
              label="최종 자산 (Buy&Hold)"
              value={usd(result.buyHoldFinalValue)}
              sub={`${result.buyHoldReturnPct >= 0 ? '+' : ''}${result.buyHoldReturnPct.toFixed(1)}%`}
            />
            <Tile
              label="초과수익 (vs Buy&Hold)"
              value={`${excessReturnPct !== null && excessReturnPct >= 0 ? '+' : ''}${excessReturnPct?.toFixed(1)}%p`}
            />
            <Tile label="리밸런싱 횟수" value={`${result.rebalanceCount}회`} />
            <Tile label="누적 수수료" value={usd(result.totalFeesPaid)} />
          </div>

          <div className="mt-4 rounded-lg border bg-card p-4" ref={chartAreaRef}>
            <BacktestChart points={result.points} width={chartWidth} />
          </div>
        </>
      )}
    </div>
  )
}
