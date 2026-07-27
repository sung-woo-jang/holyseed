import { useState } from 'react'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { useVrCandles, useVrState } from '@/features/vr/api/hooks'
import { VrCandleChart, type VrPriceLevels } from '@/features/vr/ui/VrCandleChart'
import type { VrCandleRange } from '@/features/vr/api/types'

const RANGE_LABEL: Record<VrCandleRange, string> = {
  '1m': '1개월',
  '3m': '3개월',
  all: '전체',
  intraday: '인트라데이',
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-0.5 w-3 rounded" style={{ background: color }} />
      {label}
    </span>
  )
}

export default function VrChartPage() {
  const [range, setRange] = useState<VrCandleRange>('3m')
  const { data: candlesRes, isLoading } = useVrCandles(range)
  const { data: stateRes } = useVrState()

  // 토스 API는 최신순으로 내려주므로 차트용으로 시간순 정렬
  const candles = candlesRes?.data.candles.slice().reverse() ?? []
  const state = stateRes?.data

  let levels: VrPriceLevels | null = null
  if (state && state.quantity > 0 && state.vValue > 0) {
    levels = {
      vPrice: state.vValue / state.quantity,
      minPrice: state.minBand / state.quantity,
      maxPrice: state.maxBand / state.quantity,
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title={`${state?.settings.symbol ?? 'TQQQ'} 차트`}
        description="V·밴드는 평가금($) 기준이라, 현재 보유수량으로 환산한 주가 라인으로 표시됩니다."
        action={
          <div className="flex gap-1">
            {(Object.keys(RANGE_LABEL) as VrCandleRange[]).map((r) => (
              <Button key={r} size="sm" variant={range === r ? 'default' : 'outline'} onClick={() => setRange(r)}>
                {RANGE_LABEL[r]}
              </Button>
            ))}
          </div>
        }
      />

      <div className="mt-6 rounded-lg border bg-card p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : (
          <VrCandleChart candles={candles} range={range} levels={levels} />
        )}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <LegendDot color="var(--destructive)" label="최대밴드" />
          <LegendDot color="var(--primary)" label="V" />
          <LegendDot color="#f59e0b" label="최소밴드" />
        </div>
        {state && !levels && (
          <p className="mt-2 text-xs text-muted-foreground">보유수량이 0이라 V/밴드 라인은 표시되지 않습니다.</p>
        )}
      </div>
    </div>
  )
}
