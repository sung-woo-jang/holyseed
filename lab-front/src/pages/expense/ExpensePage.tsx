import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { FormSheet, FormSheetContent, FormSheetFooter, FormSheetHeader, FormSheetTitle } from '@/shared/ui/form-sheet'
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
import { useCreateExpense, useDeleteExpense, useExpenseMonth, useUpdateExpense } from '@/features/expense/api/hooks'
import type { Expense, ExpenseInput, ExpenseKind, ExpenseType } from '@/features/expense/api/types'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

const CATEGORY_OPTIONS = [
  '주거',
  '통신',
  '공과금',
  '보험',
  '차량/유류비',
  '구독서비스',
  '대출/할부',
  '생활',
  '기타지출',
  '급여',
  '기타수입',
] as const

const EXPENSE_TYPE_META: Record<ExpenseType, string> = {
  FIXED_SAME: '고정-동일금액',
  FIXED_VARIABLE: '고정-가변금액',
  IRREGULAR: '비정기-다회성',
}

interface FormState {
  title: string
  date: string
  kind: ExpenseKind
  category: string
  expenseType: ExpenseType | ''
  amount: string
  memo: string
}

const emptyForm = (date: string): FormState => ({
  title: '',
  date,
  kind: 'EXPENSE',
  category: '생활',
  expenseType: 'IRREGULAR',
  amount: '',
  memo: '',
})

function ExpenseDialog({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  editing: Expense | null
  defaultDate: string
}) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultDate))
  const create = useCreateExpense()
  const update = useUpdateExpense()

  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(
        editing
          ? {
              title: editing.title,
              date: editing.date,
              kind: editing.kind,
              category: editing.category,
              expenseType: editing.expenseType ?? '',
              amount: String(editing.amount),
              memo: editing.memo ?? '',
            }
          : emptyForm(defaultDate),
      )
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: ExpenseInput = {
      title: form.title,
      date: form.date,
      kind: form.kind,
      category: form.category,
      expenseType: form.kind === 'EXPENSE' ? form.expenseType || undefined : null,
      amount: parseInt(form.amount, 10) || 0,
      memo: form.memo || undefined,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('기록이 수정되었습니다.')
      } else {
        await create.mutateAsync(input)
        toast.success('기록이 추가되었습니다.')
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '저장에 실패했습니다.')
    }
  }

  return (
    <FormSheet open={open} onOpenChange={(v) => !v && onClose()}>
      <FormSheetContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <FormSheetHeader>
          <FormSheetTitle>{editing ? '지출·수입 기록 수정' : '지출·수입 기록 추가'}</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>항목</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="월세" />
            </div>
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>구분</Label>
              <Select
                value={form.kind}
                onValueChange={(v) => set('kind', v as ExpenseKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">지출</SelectItem>
                  <SelectItem value="INCOME">수입</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>분류</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.kind === 'EXPENSE' && (
              <div className="space-y-2">
                <Label>지출유형</Label>
                <Select value={form.expenseType || undefined} onValueChange={(v) => set('expenseType', v as ExpenseType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_TYPE_META).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>금액 (원)</Label>
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea rows={2} value={form.memo} onChange={(e) => set('memo', e.target.value)} />
          </div>

          <FormSheetFooter>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {editing ? '수정' : '추가'}
            </Button>
          </FormSheetFooter>
        </form>
      </FormSheetContent>
    </FormSheet>
  )
}

export default function ExpensePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const { data: res, isLoading } = useExpenseMonth(year, month)
  const deleteExpense = useDeleteExpense()
  const isDesktop = useIsDesktopNav()

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
      await deleteExpense.mutateAsync(id)
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="지출내역"
        description="수입·지출 기록 및 고정지출 자동 집계"
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
            <p className="text-xs text-muted-foreground">총수입</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalIncome)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">총지출</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalExpense)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">순현금흐름</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.netCashflow)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">이번 달 고정지출</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.fixedExpenseTotal)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">고정-동일금액 + 고정-가변금액</p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border bg-card p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : isDesktop ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>항목</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>분류</TableHead>
                <TableHead>지출유형</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    이 달의 기록이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date.slice(5)}</TableCell>
                  <TableCell className="max-w-48 truncate" title={r.memo ?? undefined}>
                    {r.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.kind === 'INCOME' ? 'default' : 'secondary'}>
                      {r.kind === 'INCOME' ? '수입' : '지출'}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.expenseType ? EXPENSE_TYPE_META[r.expenseType] : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{won(r.amount)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        ) : (
          <RecordCardList>
            {records.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">이 달의 기록이 없습니다.</p>
            )}
            {records.map((r) => (
              <RecordCard
                key={r.id}
                onClick={() => {
                  setEditing(r)
                  setDialogOpen(true)
                }}
              >
                <RecordCardRow>
                  <div className="min-w-0">
                    <Badge variant={r.kind === 'INCOME' ? 'default' : 'secondary'} className="text-[10px]">
                      {r.kind === 'INCOME' ? '수입' : '지출'}
                    </Badge>
                    <p className="mt-1 truncate font-medium">{r.title}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>
                    <p className="font-semibold tabular-nums">{won(r.amount)}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-9">
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
                </RecordCardRow>
                <RecordCardMeta>
                  <span>{r.date.slice(5)}</span>
                  <span>· {r.category}</span>
                  {r.expenseType && <span>· {EXPENSE_TYPE_META[r.expenseType]}</span>}
                </RecordCardMeta>
              </RecordCard>
            ))}
          </RecordCardList>
        )}
      </div>

      <ExpenseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} defaultDate={defaultDate} />
    </div>
  )
}
