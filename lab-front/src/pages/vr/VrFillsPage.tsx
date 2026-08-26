import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  FormSheet,
  FormSheetContent,
  FormSheetFooter,
  FormSheetHeader,
  FormSheetTitle,
  FormSheetTrigger,
} from '@/shared/ui/form-sheet'
import { RecordCard, RecordCardList, RecordCardMeta, RecordCardRow } from '@/shared/ui/record-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { cn } from '@/shared/lib/utils'
import { useCreateCycle, useCreateFill, useDeleteFill, useVrCycles, useVrFills } from '@/features/vr/api/hooks'
import type { VrFill, VrFillKind } from '@/features/vr/api/types'

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const KIND_LABEL: Record<VrFillKind, string> = { INITIAL_BUY: '초기매수', BUY: '매수', SELL: '매도', DEPOSIT: '적립' }

interface HeldLot {
  price: number
  fillDate: string
  cycleNo: number
}

/** FIFO로 지금까지의 체결을 재생해 "현재 보유 중인 주식 하나하나가 얼마에 샀는지"를 복원한다. */
function computeHeldLots(fills: VrFill[]): HeldLot[] {
  const chronological = [...fills].sort((a, b) => (a.fillDate === b.fillDate ? a.id - b.id : a.fillDate.localeCompare(b.fillDate)))
  const queue: HeldLot[] = []
  for (const f of chronological) {
    if (f.kind === 'BUY' || f.kind === 'INITIAL_BUY') {
      for (let i = 0; i < f.quantity; i++) queue.push({ price: f.price, fillDate: f.fillDate, cycleNo: f.cycleNo })
    } else if (f.kind === 'SELL') {
      queue.splice(0, f.quantity)
    }
  }
  return queue
}

function FillDialog() {
  const [open, setOpen] = useState(false)
  const [fillDate, setFillDate] = useState(new Date().toISOString().slice(0, 10))
  const [kind, setKind] = useState<VrFillKind>('BUY')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const createFill = useCreateFill()

  const isDeposit = kind === 'DEPOSIT'

  function handleKindChange(v: VrFillKind) {
    setKind(v)
    if (v === 'DEPOSIT') setQuantity('0')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createFill.mutateAsync({
        fillDate,
        kind,
        price: parseFloat(price),
        quantity: isDeposit ? 0 : parseInt(quantity, 10),
      })
      toast.success('체결이 등록되었습니다. Pool·보유·평단이 갱신됐습니다.')
      setOpen(false)
      setPrice('')
      setQuantity('')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '체결 등록에 실패했습니다.')
    }
  }

  return (
    <FormSheet open={open} onOpenChange={setOpen}>
      <FormSheetTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> 체결 등록
        </Button>
      </FormSheetTrigger>
      <FormSheetContent className="max-w-sm">
        <FormSheetHeader>
          <FormSheetTitle>체결 등록</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>체결일</Label>
            <Input type="date" value={fillDate} onChange={(e) => setFillDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>구분</Label>
            <Select value={kind} onValueChange={(v) => handleKindChange(v as VrFillKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">매수</SelectItem>
                <SelectItem value="SELL">매도</SelectItem>
                <SelectItem value="INITIAL_BUY">초기매수</SelectItem>
                <SelectItem value="DEPOSIT">적립</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{isDeposit ? '적립금액 ($)' : '체결가 ($)'}</Label>
              <Input type="number" step="0.0001" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>수량</Label>
              <Input
                type="number"
                min="1"
                value={isDeposit ? '0' : quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isDeposit}
                required={!isDeposit}
              />
            </div>
          </div>
          <FormSheetFooter>
            <Button type="submit" disabled={createFill.isPending}>
              등록
            </Button>
          </FormSheetFooter>
        </form>
      </FormSheetContent>
    </FormSheet>
  )
}

function CycleDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ cycleNo: '', startDate: '', endDate: '', vValue: '', poolStart: '' })
  const createCycle = useCreateCycle()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createCycle.mutateAsync({
        cycleNo: parseInt(form.cycleNo, 10),
        startDate: form.startDate,
        endDate: form.endDate,
        vValue: parseFloat(form.vValue),
        poolStart: parseFloat(form.poolStart),
      })
      toast.success('사이클이 등록되었습니다.')
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '사이클 등록에 실패했습니다.')
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <FormSheet open={open} onOpenChange={setOpen}>
      <FormSheetTrigger asChild>
        <Button variant="outline">사이클 수동 등록</Button>
      </FormSheetTrigger>
      <FormSheetContent className="max-w-sm">
        <FormSheetHeader>
          <FormSheetTitle>사이클 수동 등록</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>사이클 번호</Label>
              <Input type="number" min="1" value={form.cycleNo} onChange={set('cycleNo')} required />
            </div>
            <div className="space-y-2">
              <Label>V 값 ($)</Label>
              <Input type="number" step="0.01" value={form.vValue} onChange={set('vValue')} required />
            </div>
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input type="date" value={form.startDate} onChange={set('startDate')} required />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input type="date" value={form.endDate} onChange={set('endDate')} required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>시작 Pool ($)</Label>
              <Input type="number" step="0.01" value={form.poolStart} onChange={set('poolStart')} required />
            </div>
          </div>
          <FormSheetFooter>
            <Button type="submit" disabled={createCycle.isPending}>
              등록
            </Button>
          </FormSheetFooter>
        </form>
      </FormSheetContent>
    </FormSheet>
  )
}

export default function VrFillsPage() {
  const { data: fillsRes } = useVrFills()
  const { data: cyclesRes } = useVrCycles()
  const deleteFill = useDeleteFill()
  const isDesktop = useIsDesktopNav()

  const fills = fillsRes?.data ?? []
  const cycles = cyclesRes?.data ?? []
  const [selectedCycleNo, setSelectedCycleNo] = useState<number | null>(null)
  const fillsSectionRef = useRef<HTMLDivElement>(null)

  const selectedCycle = cycles.find((c) => c.cycleNo === selectedCycleNo) ?? null
  const visibleFills = selectedCycleNo === null ? [] : fills.filter((f) => f.cycleNo === selectedCycleNo)

  const latestFill = fills[0] // findAllFills()는 최신순 정렬
  const heldLots = computeHeldLots(fills).slice().reverse() // 최근에 산 주식이 위로

  function handleSelectCycle(cycleNo: number) {
    setSelectedCycleNo((prev) => (prev === cycleNo ? null : cycleNo))
    fillsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleDelete(id: number) {
    try {
      await deleteFill.mutateAsync(id)
      toast.success('체결 삭제 — 스냅샷을 재계산했습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="체결 · 사이클"
        description="체결 등록 시 Pool/보유수량/평단이 자동 계산됩니다."
        action={
          <div className="flex gap-2">
            <CycleDialog />
            <FillDialog />
          </div>
        }
      />

      <div className="mt-6 rounded-lg border bg-card p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">보유 주식 상세</h2>
          {latestFill && (
            <p className="mt-1 text-xs text-muted-foreground">
              현재 {latestFill.qtyAfter}주 보유 · 평단 {usd(latestFill.avgPriceAfter)} (FIFO 기준 낱개 매수가)
            </p>
          )}
        </div>
        {heldLots.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">보유 중인 주식이 없습니다.</p>
        ) : isDesktop ? (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>매수일</TableHead>
                  <TableHead className="text-right">매수가</TableHead>
                  <TableHead className="text-right">사이클</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heldLots.map((lot, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{heldLots.length - i}</TableCell>
                    <TableCell>{lot.fillDate}</TableCell>
                    <TableCell className="text-right tabular-nums">{usd(lot.price)}</TableCell>
                    <TableCell className="text-right tabular-nums">{lot.cycleNo}차</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <RecordCardList>
              {heldLots.map((lot, i) => (
                <RecordCard key={i}>
                  <RecordCardRow>
                    <p className="text-sm text-muted-foreground">
                      {heldLots.length - i}번째 · {lot.cycleNo}차 사이클
                    </p>
                    <p className="font-semibold tabular-nums">{usd(lot.price)}</p>
                  </RecordCardRow>
                  <RecordCardMeta>
                    <span>{lot.fillDate}</span>
                  </RecordCardMeta>
                </RecordCard>
              ))}
            </RecordCardList>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">사이클 히스토리</h2>
        {isDesktop ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사이클</TableHead>
              <TableHead>기간</TableHead>
              <TableHead className="text-right">V</TableHead>
              <TableHead className="text-right">최소밴드</TableHead>
              <TableHead className="text-right">최대밴드</TableHead>
              <TableHead className="text-right">Pool 시작</TableHead>
              <TableHead className="text-right">Pool 종료</TableHead>
              <TableHead className="text-right">거래액</TableHead>
              <TableHead className="text-right">적립금</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  사이클이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {cycles.map((c) => (
              <TableRow
                key={c.id}
                className={cn('cursor-pointer hover:bg-muted/50', c.cycleNo === selectedCycleNo && 'bg-muted/70')}
                onClick={() => handleSelectCycle(c.cycleNo)}
              >
                <TableCell>{c.cycleNo}</TableCell>
                <TableCell>
                  {c.startDate} ~ {c.endDate}
                </TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.vValue)}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.minBand)}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.maxBand)}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.poolStart)}</TableCell>
                <TableCell className="text-right tabular-nums">{c.poolEnd !== null ? usd(c.poolEnd) : '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.tradeAmount)}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.depositAmount)}</TableCell>
                <TableCell>
                  <Badge variant={c.isClosed ? 'secondary' : 'default'}>{c.isClosed ? '종료' : '진행 중'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        ) : (
          <RecordCardList>
            {cycles.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">사이클이 없습니다.</p>
            )}
            {cycles.map((c) => (
              <RecordCard
                key={c.id}
                className={cn(c.cycleNo === selectedCycleNo && 'border-primary')}
                onClick={() => handleSelectCycle(c.cycleNo)}
              >
                <RecordCardRow>
                  <div className="min-w-0">
                    <p className="font-medium">{c.cycleNo}차 사이클</p>
                    <Badge variant={c.isClosed ? 'secondary' : 'default'} className="mt-1 text-[10px]">
                      {c.isClosed ? '종료' : '진행 중'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">V {usd(c.vValue)}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">적립 {usd(c.depositAmount)}</p>
                  </div>
                </RecordCardRow>
                <RecordCardMeta>
                  <span>
                    {c.startDate} ~ {c.endDate}
                  </span>
                  <span>
                    · Pool {usd(c.poolStart)} → {c.poolEnd !== null ? usd(c.poolEnd) : '—'}
                  </span>
                  <span>
                    · 밴드 {usd(c.minBand)} ~ {usd(c.maxBand)}
                  </span>
                  <span>· 거래액 {usd(c.tradeAmount)}</span>
                </RecordCardMeta>
              </RecordCard>
            ))}
          </RecordCardList>
        )}
      </div>

      {selectedCycle && (
        <div ref={fillsSectionRef} className="mt-6 scroll-mt-4 rounded-lg border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">{selectedCycle.cycleNo}차 사이클 체결 내역</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedCycle.startDate} ~ {selectedCycle.endDate} · V {usd(selectedCycle.vValue)} · 밴드{' '}
                {usd(selectedCycle.minBand)} ~ {usd(selectedCycle.maxBand)} · Pool {usd(selectedCycle.poolStart)} →{' '}
                {selectedCycle.poolEnd !== null ? usd(selectedCycle.poolEnd) : '—'} · 거래액{' '}
                {usd(selectedCycle.tradeAmount)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCycleNo(null)}>
              선택 해제
            </Button>
          </div>
          {isDesktop ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>구분</TableHead>
                  <TableHead className="text-right">가격</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">체결금액</TableHead>
                  <TableHead className="text-right">Pool 변화</TableHead>
                  <TableHead className="text-right">변화 후 Pool</TableHead>
                  <TableHead className="text-right">보유</TableHead>
                  <TableHead className="text-right">평단</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleFills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      이 사이클에 체결 기록이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {visibleFills.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.fillDate}</TableCell>
                    <TableCell>
                      <Badge variant={f.kind === 'SELL' ? 'default' : 'secondary'}>{KIND_LABEL[f.kind]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{usd(f.price)}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{usd(f.amount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{usd(f.poolChange)}</TableCell>
                    <TableCell className="text-right tabular-nums">{usd(f.poolAfter)}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.qtyAfter}주</TableCell>
                    <TableCell className="text-right tabular-nums">{usd(f.avgPriceAfter)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>체결을 삭제할까요?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(f.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <RecordCardList>
              {visibleFills.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">이 사이클에 체결 기록이 없습니다.</p>
              )}
              {visibleFills.map((f) => (
                <RecordCard key={f.id}>
                  <RecordCardRow>
                    <div className="min-w-0">
                      <Badge variant={f.kind === 'SELL' ? 'default' : 'secondary'} className="text-[10px]">
                        {KIND_LABEL[f.kind]}
                      </Badge>
                      <p className="mt-1 text-sm text-muted-foreground">{f.fillDate}</p>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">{usd(f.amount)}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">Pool {usd(f.poolAfter)}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-9">
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>체결을 삭제할까요?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(f.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </RecordCardRow>
                  <RecordCardMeta>
                    <span>가격 {usd(f.price)}</span>
                    <span>· 수량 {f.quantity}</span>
                    <span>· 보유 {f.qtyAfter}주</span>
                    <span>· 평단 {usd(f.avgPriceAfter)}</span>
                  </RecordCardMeta>
                </RecordCard>
              ))}
            </RecordCardList>
          )}
        </div>
      )}
    </div>
  )
}
