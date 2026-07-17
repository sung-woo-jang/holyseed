import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
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
import {
  fetchWorklogMonthNet,
  useDeleteRecord,
  usePlanPreview,
  useSavingRecords,
  useSavingSummary,
  useUpsertRecord,
} from '@/features/saving/api/hooks'
import type { SavingRecord } from '@/features/saving/api/types'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const manwon = (n: number) => `${Math.round(n / 10000).toLocaleString('ko-KR')}만 원`

function RecordDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: SavingRecord | null }) {
  const now = new Date()
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [form, setForm] = useState({ yearMonth: currentYm, income: '', actualSaving: '', memo: '' })
  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(
        editing
          ? {
              yearMonth: editing.yearMonth,
              income: String(editing.income),
              actualSaving: editing.actualSaving !== null ? String(editing.actualSaving) : '',
              memo: editing.memo ?? '',
            }
          : { yearMonth: currentYm, income: '', actualSaving: '', memo: '' },
      )
    }
  }

  const upsert = useUpsertRecord()
  const planPreview = usePlanPreview()
  const [prefilling, setPrefilling] = useState(false)

  const income = parseInt(form.income, 10)
  const plan = planPreview.data?.data

  async function handleIncomeBlur() {
    if (!isNaN(income) && income > 0) {
      planPreview.mutate({ income })
    }
  }

  async function handlePrefillFromWorklog() {
    setPrefilling(true)
    try {
      const net = await fetchWorklogMonthNet(form.yearMonth)
      setForm((f) => ({ ...f, income: String(net) }))
      if (net > 0) planPreview.mutate({ income: net })
      toast.success(`근무일지 ${form.yearMonth} 실수령 합계 ${won(net)}를 가져왔습니다.`)
    } catch {
      toast.error('근무일지 집계를 가져오지 못했습니다.')
    } finally {
      setPrefilling(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await upsert.mutateAsync({
        yearMonth: form.yearMonth,
        income,
        actualSaving: form.actualSaving !== '' ? parseInt(form.actualSaving, 10) : null,
        memo: form.memo || undefined,
      })
      toast.success('저축 기록이 저장되었습니다.')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '저장에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? '월별 기록 수정' : '월별 기록 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>연월</Label>
            <Input
              type="month"
              value={form.yearMonth}
              onChange={(e) => setForm((f) => ({ ...f, yearMonth: e.target.value }))}
              required
              disabled={!!editing}
            />
          </div>
          <div className="space-y-2">
            <Label>실수령 수입 합산 (원, 세후 모든 수입원)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="10000"
                value={form.income}
                onChange={(e) => setForm((f) => ({ ...f, income: e.target.value }))}
                onBlur={handleIncomeBlur}
                required
              />
              <Button type="button" variant="outline" onClick={handlePrefillFromWorklog} disabled={prefilling}>
                <Download className="mr-1 size-4" /> 근무일지
              </Button>
            </div>
          </div>

          {plan && !isNaN(income) && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">적용 저축률</span>
                <b>{plan.rate}%</b>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">이번 달 투자 목표</span>
                <b className="tabular-nums">{won(plan.savingTarget)}</b>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">이번 달 소비 한도</span>
                <b className="tabular-nums">{won(plan.spendingLimit)}</b>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>실제 저축액 (원, 확정 시 입력)</Label>
            <Input
              type="number"
              min="0"
              step="10000"
              value={form.actualSaving}
              onChange={(e) => setForm((f) => ({ ...f, actualSaving: e.target.value }))}
              placeholder="(선택 — 미입력 시 목표액으로 집계)"
            />
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea rows={2} value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={upsert.isPending}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SavingPage() {
  const { data: recordsRes, isLoading } = useSavingRecords()
  const { data: summaryRes } = useSavingSummary()
  const deleteRecord = useDeleteRecord()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SavingRecord | null>(null)

  const records = recordsRes?.data ?? []
  const summary = summaryRes?.data

  async function handleDelete(id: number) {
    try {
      await deleteRecord.mutateAsync(id)
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="1억 저축 플래너"
        description="월 실수령 수입 → 소비 한도·투자 목표 산출 (예적금 대신 투자 운용)"
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" /> 월별 기록
          </Button>
        }
      />

      {summary && (
        <div className="mt-6 rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              목표 <b className="text-foreground">{manwon(summary.goal)}</b> 중{' '}
              <b className="text-foreground tabular-nums">{won(summary.totalSaved)}</b> 저축
            </p>
            <p className="text-sm text-muted-foreground">
              {summary.expectedDoneAt ? (
                <>
                  달성 예상 <b className="text-foreground">{summary.expectedDoneAt}</b> (월평균 {manwon(summary.avgMonthly)})
                </>
              ) : summary.totalSaved >= summary.goal ? (
                '🎉 목표 달성!'
              ) : (
                '기록이 쌓이면 달성 예상 시점이 계산됩니다'
              )}
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, summary.progressPct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs text-muted-foreground">{summary.progressPct}%</p>
        </div>
      )}

      <div className="mt-4 rounded-lg border bg-card p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>연월</TableHead>
                <TableHead className="text-right">수입</TableHead>
                <TableHead className="text-right">저축률</TableHead>
                <TableHead className="text-right">투자 목표</TableHead>
                <TableHead className="text-right">소비 한도</TableHead>
                <TableHead className="text-right">실제 저축</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    기록이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.yearMonth}</TableCell>
                  <TableCell className="text-right tabular-nums">{won(r.income)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.savingRate}%</TableCell>
                  <TableCell className="text-right tabular-nums">{won(r.savingTarget)}</TableCell>
                  <TableCell className="text-right tabular-nums">{won(r.spendingLimit)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.actualSaving !== null ? won(r.actualSaving) : <span className="text-muted-foreground">목표 적용</span>}
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
                            <AlertDialogTitle>{r.yearMonth} 기록을 삭제할까요?</AlertDialogTitle>
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RecordDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
    </div>
  )
}
