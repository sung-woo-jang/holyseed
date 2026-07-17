import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
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
import { useCreateWorklog, useDeleteWorklog, useUpdateWorklog, useWorklogMonth } from '@/features/worklog/api/hooks'
import type { PayStatus, Worklog, WorklogInput } from '@/features/worklog/api/types'
import { calcWorklogAmount, getDailyWage, JOB_OPTIONS, WITHHOLDING_RATE } from '@/features/worklog/lib/worklog-calc'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

const PAY_STATUS_META: Record<PayStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  RECEIVED: { label: '✅ 수령완료', variant: 'default' },
  EXPECTED: { label: '🟠 예상(미수령)', variant: 'secondary' },
  UNPAID: { label: '🟡 미수령', variant: 'destructive' },
  DAYOFF: { label: '휴무', variant: 'outline' },
}

interface FormState {
  title: string
  workDate: string
  startTime: string
  endTime: string
  breakHours: string
  jobs: string[]
  payStatus: PayStatus
  dailyWage: string
  amountOverride: string
  address: string
  memo: string
}

const emptyForm = (date: string): FormState => ({
  title: '',
  workDate: date,
  startTime: '08:00',
  endTime: '17:00',
  breakHours: '1',
  jobs: [],
  payStatus: 'EXPECTED',
  dailyWage: String(getDailyWage(date)),
  amountOverride: '',
  address: '',
  memo: '',
})

function WorklogDialog({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  editing: Worklog | null
  defaultDate: string
}) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultDate))
  const create = useCreateWorklog()
  const update = useUpdateWorklog()

  // 다이얼로그 열릴 때 폼 초기화
  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(
        editing
          ? {
              title: editing.title,
              workDate: editing.workDate,
              startTime: editing.startTime ?? '',
              endTime: editing.endTime ?? '',
              breakHours: String(editing.breakHours),
              jobs: editing.jobs,
              payStatus: editing.payStatus,
              dailyWage: String(editing.dailyWage),
              amountOverride: editing.amountOverride !== null ? String(editing.amountOverride) : '',
              address: editing.address ?? '',
              memo: editing.memo ?? '',
            }
          : emptyForm(defaultDate),
      )
    }
  }

  const preview = calcWorklogAmount({
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    breakHours: parseFloat(form.breakHours) || 0,
    dailyWage: parseInt(form.dailyWage, 10) || 0,
    isDayoff: form.payStatus === 'DAYOFF',
  })
  const effective = form.amountOverride !== '' ? parseInt(form.amountOverride, 10) || 0 : preview
  const net = Math.round(effective * (1 - WITHHOLDING_RATE))

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: WorklogInput = {
      title: form.title,
      workDate: form.workDate,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      breakHours: parseFloat(form.breakHours) || 0,
      jobs: form.jobs,
      payStatus: form.payStatus,
      dailyWage: parseInt(form.dailyWage, 10) || 0,
      amountOverride: form.amountOverride !== '' ? parseInt(form.amountOverride, 10) : null,
      address: form.address || undefined,
      memo: form.memo || undefined,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('근무 기록이 수정되었습니다.')
      } else {
        await create.mutateAsync(input)
        toast.success('근무 기록이 추가되었습니다.')
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '저장에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? '근무 기록 수정' : '근무 기록 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>현장명 (여러 곳이면 / 구분)</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="송도 / 학익" />
            </div>
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input
                type="date"
                value={form.workDate}
                onChange={(e) => {
                  set('workDate', e.target.value)
                  if (!editing) set('dailyWage', String(getDailyWage(e.target.value)))
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>수령여부</Label>
              <Select value={form.payStatus} onValueChange={(v) => set('payStatus', v as PayStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAY_STATUS_META).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>시작</Label>
              <Input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>종료</Label>
              <Input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>휴게 (시간)</Label>
              <Input type="number" step="0.5" min="0" value={form.breakHours} onChange={(e) => set('breakHours', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>일급여 (원)</Label>
              <Input type="number" min="0" step="10000" value={form.dailyWage} onChange={(e) => set('dailyWage', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>업무</Label>
            <div className="flex gap-4">
              {JOB_OPTIONS.map((job) => (
                <label key={job} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={form.jobs.includes(job)}
                    onCheckedChange={(checked) =>
                      set('jobs', checked ? [...form.jobs, job] : form.jobs.filter((j) => j !== job))
                    }
                  />
                  {job}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>주소</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea rows={2} value={form.memo} onChange={(e) => set('memo', e.target.value)} />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">계산 금액</span>
              <b className="tabular-nums">{won(preview)}</b>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">실수령 오버라이드</span>
              <Input
                type="number"
                className="h-8 w-36 text-right"
                placeholder="(선택)"
                value={form.amountOverride}
                onChange={(e) => set('amountOverride', e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span className="text-muted-foreground">실수령 (3.3% 공제)</span>
              <b className="tabular-nums">{won(net)}</b>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {editing ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function WorklogPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Worklog | null>(null)

  const { data: res, isLoading } = useWorklogMonth(year, month)
  const deleteWorklog = useDeleteWorklog()

  const records = res?.data?.records ?? []
  const summary = res?.data?.summary

  const defaultDate = useMemo(() => {
    const m = String(month).padStart(2, '0')
    const today = now.toISOString().slice(0, 10)
    return today.startsWith(`${year}-${m}`) ? today : `${year}-${m}-01`
  }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  function moveMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  async function handleDelete(id: number) {
    try {
      await deleteWorklog.mutateAsync(id)
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="근무일지"
        description="근무 기록·급여 계산·수령 관리 (원천징수 3.3%)"
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" /> 기록 추가
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => moveMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-28 text-center text-sm font-semibold">
          {year}년 {month}월
        </span>
        <Button variant="outline" size="icon" onClick={() => moveMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">근무일수</p>
            <p className="mt-1 text-lg font-semibold">{summary.workDays}일</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">합계 (세전)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalAmount)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">실수령 합계</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalNet)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">수령 / 미수령</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {won(summary.receivedNet)} <span className="text-sm font-normal text-muted-foreground">/ {won(summary.pendingNet)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border bg-card p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>현장</TableHead>
                <TableHead>근무시간</TableHead>
                <TableHead>업무</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead className="text-right">실수령</TableHead>
                <TableHead>수령</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    이 달의 기록이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => {
                const meta = PAY_STATUS_META[r.payStatus]
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.workDate.slice(5)}</TableCell>
                    <TableCell className="max-w-40 truncate" title={r.memo ?? undefined}>
                      {r.title}
                    </TableCell>
                    <TableCell>
                      {r.payStatus === 'DAYOFF' ? '휴무' : r.startTime && r.endTime ? `${r.startTime}~${r.endTime}` : '—'}
                    </TableCell>
                    <TableCell>{r.jobs.join(', ') || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {won(r.effectiveAmount)}
                      {r.amountOverride !== null && <span className="ml-1 text-xs text-muted-foreground">*</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{won(r.netAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setEditing(r)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <Trash2 className="size-4 text-muted-foreground" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>기록을 삭제할까요?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(r.id)}>삭제</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        <p className="mt-2 text-xs text-muted-foreground">* 표시는 수동 오버라이드된 금액 (실수령액 우선 원칙)</p>
      </div>

      <WorklogDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} defaultDate={defaultDate} />
    </div>
  )
}
