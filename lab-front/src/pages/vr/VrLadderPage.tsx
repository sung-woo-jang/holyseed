import { PageHeader } from '@/widgets/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { cn } from '@/shared/lib/utils'
import { useVrState } from '@/features/vr/api/hooks'
import { buildBuyLadder, buildSellLadder, type LadderRow } from '@/features/vr/lib/ladder'

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function LadderTable({ rows, kind }: { rows: LadderRow[]; kind: 'buy' | 'sell' }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>체결 후 보유</TableHead>
          <TableHead className="text-right">트리거가</TableHead>
          <TableHead className="text-right">{kind === 'buy' ? 'Pool 잔액 (차감)' : 'Pool 잔액 (가산)'}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.qtyAfter} className={cn(row.exceedsLimit && 'text-destructive')}>
            <TableCell>{row.qtyAfter}주{row.exceedsLimit && ' ⚠ 한도 초과'}</TableCell>
            <TableCell className="text-right tabular-nums">{usd(row.triggerPrice)}</TableCell>
            <TableCell className="text-right tabular-nums">{usd(row.poolAfter)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function VrLadderPage() {
  const { data: res, isLoading } = useVrState()
  const state = res?.data

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">불러오는 중…</div>
  if (!state || state.vValue <= 0) {
    return (
      <div className="p-6">
        <PageHeader title="예약 매수/매도표" description="진행 중인 사이클이 없어 계산할 수 없습니다." />
      </div>
    )
  }

  const buyRows = buildBuyLadder({
    quantity: state.quantity,
    minBand: state.minBand,
    pool: state.pool,
    usablePool: state.usablePool,
  })
  const sellRows = buildSellLadder({ quantity: state.quantity, maxBand: state.maxBand, pool: state.pool })

  return (
    <div className="p-6">
      <PageHeader
        title="예약 매수/매도표 (계단식)"
        description={`보유 ${state.quantity}주 · 최소밴드 ${usd(state.minBand)} · 최대밴드 ${usd(state.maxBand)} · Pool ${usd(state.pool)} — 1주씩 순차 체결 가정, 매 단계 트리거가 재계산`}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">
            매수표 <span className="font-normal text-muted-foreground">— 트리거가 = 최소밴드 ÷ 직전 보유수량</span>
          </h2>
          <LadderTable rows={buyRows} kind="buy" />
          <p className="mt-2 text-xs text-muted-foreground">
            ⚠ 표시는 누적 매수액이 사용가능 Pool({usd(state.usablePool)})을 초과하는 구간
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">
            매도표 <span className="font-normal text-muted-foreground">— 트리거가 = 최대밴드 ÷ 직전 보유수량</span>
          </h2>
          {sellRows.length > 0 ? (
            <LadderTable rows={sellRows} kind="sell" />
          ) : (
            <p className="text-sm text-muted-foreground">보유수량이 없습니다.</p>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        ※ 실제 증권사 예약 주문이 아닌 참조/시뮬레이션 용도 (수동 시장가 체결). 계산 전 보유수량·밴드·Pool을 개요에서
        재확인하세요.
      </p>
    </div>
  )
}
