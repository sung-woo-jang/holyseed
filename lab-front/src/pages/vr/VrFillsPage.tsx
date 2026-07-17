import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
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
import { useCreateCycle, useCreateFill, useDeleteFill, useVrCycles, useVrFills } from '@/features/vr/api/hooks'
import type { VrFillKind } from '@/features/vr/api/types'

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const KIND_LABEL: Record<VrFillKind, string> = { INITIAL_BUY: '초기매수', BUY: '매수', SELL: '매도', DEPOSIT: '적립' }

function FillDialog() {
  const [open, setOpen] = useState(false)
  const [fillDate, setFillDate] = useState(new Date().toISOString().slice(0, 10))
  const [kind, setKind] = useState<VrFillKind>('BUY')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const createFill = useCreateFill()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createFill.mutateAsync({
        fillDate,
        kind,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 size-4" /> 체결 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>체결 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>체결일</Label>
            <Input type="date" value={fillDate} onChange={(e) => setFillDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>구분</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as VrFillKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">매수</SelectItem>
                <SelectItem value="SELL">매도</SelectItem>
                <SelectItem value="INITIAL_BUY">초기매수</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>체결가 ($)</Label>
              <Input type="number" step="0.0001" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>수량</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createFill.isPending}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">사이클 수동 등록</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>사이클 수동 등록</DialogTitle>
        </DialogHeader>
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
          <DialogFooter>
            <Button type="submit" disabled={createCycle.isPending}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function VrFillsPage() {
  const { data: fillsRes } = useVrFills()
  const { data: cyclesRes } = useVrCycles()
  const deleteFill = useDeleteFill()

  const fills = fillsRes?.data ?? []
  const cycles = cyclesRes?.data ?? []

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
        <h2 className="mb-3 text-sm font-semibold">체결 히스토리</h2>
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
            {fills.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  체결 기록이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {fills.map((f) => (
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
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">사이클 히스토리</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사이클</TableHead>
              <TableHead>기간</TableHead>
              <TableHead className="text-right">V</TableHead>
              <TableHead className="text-right">Pool 시작</TableHead>
              <TableHead className="text-right">Pool 종료</TableHead>
              <TableHead className="text-right">적립금</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  사이클이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {cycles.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.cycleNo}</TableCell>
                <TableCell>
                  {c.startDate} ~ {c.endDate}
                </TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.vValue)}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.poolStart)}</TableCell>
                <TableCell className="text-right tabular-nums">{c.poolEnd !== null ? usd(c.poolEnd) : '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(c.depositAmount)}</TableCell>
                <TableCell>
                  <Badge variant={c.isClosed ? 'secondary' : 'default'}>{c.isClosed ? '종료' : '진행 중'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
