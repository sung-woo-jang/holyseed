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
import {
  useCreateLedgerTransaction,
  useDeleteLedgerTransaction,
  useLedgerAssets,
  useLedgerCategories,
  useLedgerMonth,
  useUpdateLedgerTransaction,
} from '@/features/ledger/api/hooks'
import type { LedgerCostType, LedgerTransactionInput, LedgerTransactionRecord, LedgerType } from '@/features/ledger/api/types'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

interface FormState {
  type: LedgerType
  date: string
  amount: string
  categoryId: string
  assetId: string
  costType: LedgerCostType | ''
  title: string
  memo: string
}

const emptyForm = (date: string): FormState => ({
  type: 'EXPENSE',
  date,
  amount: '',
  categoryId: '',
  assetId: '',
  costType: '',
  title: '',
  memo: '',
})

function TransactionDialog({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  editing: LedgerTransactionRecord | null
  defaultDate: string
}) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultDate))
  const { data: categoriesRes } = useLedgerCategories()
  const { data: assetsRes } = useLedgerAssets()
  const categories = categoriesRes?.data ?? []
  const assets = assetsRes?.data ?? []
  const create = useCreateLedgerTransaction()
  const update = useUpdateLedgerTransaction()

  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(
        editing
          ? {
              type: editing.type,
              date: editing.date,
              amount: String(editing.amount),
              categoryId: editing.categoryId != null ? String(editing.categoryId) : '',
              assetId: editing.assetId != null ? String(editing.assetId) : '',
              costType: editing.category?.costType ?? '',
              title: editing.title ?? '',
              memo: editing.memo ?? '',
            }
          : emptyForm(defaultDate),
      )
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const categoryOptions = categories.filter((c) => c.type === form.type)

  function selectCategory(categoryId: string) {
    const cat = categories.find((c) => String(c.id) === categoryId)
    set('categoryId', categoryId)
    set('costType', cat?.costType ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: LedgerTransactionInput = {
      date: form.date,
      type: form.type,
      amount: parseInt(form.amount, 10) || 0,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      assetId: form.assetId ? Number(form.assetId) : null,
      title: form.title || undefined,
      memo: form.memo || undefined,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('거래가 수정되었습니다.')
      } else {
        await create.mutateAsync(input)
        toast.success('거래가 등록되었습니다.')
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
          <FormSheetTitle>{editing ? '거래 수정' : '거래 등록'}</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>구분</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  set('type', v as LedgerType)
                  set('categoryId', '')
                  set('costType', '')
                }}
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
              <Label>날짜</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>제목</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="월세" />
            </div>
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={form.categoryId || undefined} onValueChange={selectCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>연결 자산 (선택)</Label>
              <Select value={form.assetId || 'none'} onValueChange={(v) => set('assetId', v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안 함</SelectItem>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.type === 'EXPENSE' && (
              <div className="space-y-2">
                <Label>기본 분류</Label>
                <Select value={form.costType || 'none'} onValueChange={(v) => set('costType', v === 'none' ? '' : (v as LedgerCostType))}>
                  <SelectTrigger>
                    <SelectValue placeholder="미지정" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미지정</SelectItem>
                    <SelectItem value="FIXED">고정비</SelectItem>
                    <SelectItem value="VARIABLE">변동비</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>금액 (원)</Label>
              <Input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea rows={2} value={form.memo} onChange={(e) => set('memo', e.target.value)} />
          </div>

          <FormSheetFooter>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {editing ? '수정' : '등록'}
            </Button>
          </FormSheetFooter>
        </form>
      </FormSheetContent>
    </FormSheet>
  )
}

export default function LedgerPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LedgerTransactionRecord | null>(null)
  const [typeFilter, setTypeFilter] = useState<'ALL' | LedgerType>('ALL')
  const [catFilter, setCatFilter] = useState<Set<number>>(new Set())

  const { data: res, isLoading } = useLedgerMonth(year, month)
  const deleteTx = useDeleteLedgerTransaction()
  const isDesktop = useIsDesktopNav()

  const records = res?.data?.records ?? []
  const summary = res?.data?.summary

  const filteredRecords = useMemo(
    () =>
      records.filter((r) => {
        if (typeFilter !== 'ALL' && r.type !== typeFilter) return false
        if (catFilter.size > 0 && (r.categoryId == null || !catFilter.has(r.categoryId))) return false
        return true
      }),
    [records, typeFilter, catFilter],
  )

  const monthCategories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; color: string }>()
    for (const r of records) {
      if (r.category) map.set(r.category.id, { id: r.category.id, name: r.category.name, color: r.category.color })
    }
    return Array.from(map.values())
  }, [records])

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

  function toggleCatFilter(id: number) {
    setCatFilter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDelete(id: number) {
    try {
      await deleteTx.mutateAsync(id)
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="거래장부"
        description="수입·지출 기록, 카테고리·자산 연결"
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" /> 거래 등록
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
            <p className="text-xs text-muted-foreground">수입</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalIncome)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">지출</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalExpense)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">순현금흐름</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.netCashflow)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">저축률</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{summary.savingsRate}%</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(['ALL', 'INCOME', 'EXPENSE'] as const).map((v) => (
          <Button key={v} size="sm" variant={typeFilter === v ? 'default' : 'outline'} onClick={() => setTypeFilter(v)}>
            {v === 'ALL' ? '전체' : v === 'INCOME' ? '수입' : '지출'}
          </Button>
        ))}
        {monthCategories.map((c) => (
          <Badge
            key={c.id}
            variant={catFilter.has(c.id) ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() => toggleCatFilter(c.id)}
          >
            <span className="mr-1 inline-block size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name}
          </Badge>
        ))}
      </div>

      {summary && summary.byCategory.length > 0 && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">카테고리별 지출</p>
          <div className="space-y-2">
            {summary.byCategory.slice(0, 5).map((c) => {
              const max = summary.byCategory[0].amount
              return (
                <div key={c.categoryId} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 truncate text-muted-foreground">{c.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(c.amount / max) * 100}%`, backgroundColor: c.color }} />
                  </div>
                  <span className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">{won(c.amount)}</span>
                </div>
              )
            })}
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
                <TableHead>제목</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>자산</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    조건에 맞는 거래가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {filteredRecords.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setEditing(r)
                    setDialogOpen(true)
                  }}
                >
                  <TableCell>{r.date.slice(5)}</TableCell>
                  <TableCell className="max-w-48 truncate" title={r.memo ?? undefined}>
                    {r.title || r.category?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.type === 'INCOME' ? 'default' : 'secondary'}>{r.type === 'INCOME' ? '수입' : '지출'}</Badge>
                  </TableCell>
                  <TableCell>{r.category ? `${r.category.icon} ${r.category.name}` : '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.asset?.name ?? '-'}</TableCell>
                  <TableCell className="text-right tabular-nums">{won(r.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                            <AlertDialogTitle>거래를 삭제할까요?</AlertDialogTitle>
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
            {filteredRecords.length === 0 && <p className="text-center text-sm text-muted-foreground">조건에 맞는 거래가 없습니다.</p>}
            {filteredRecords.map((r) => (
              <RecordCard
                key={r.id}
                onClick={() => {
                  setEditing(r)
                  setDialogOpen(true)
                }}
              >
                <RecordCardRow>
                  <div className="min-w-0">
                    <Badge variant={r.type === 'INCOME' ? 'default' : 'secondary'} className="text-[10px]">
                      {r.type === 'INCOME' ? '수입' : '지출'}
                    </Badge>
                    <p className="mt-1 truncate font-medium">{r.title || r.category?.name || '-'}</p>
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
                          <AlertDialogTitle>거래를 삭제할까요?</AlertDialogTitle>
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
                  {r.category && <span>· {r.category.icon} {r.category.name}</span>}
                  {r.asset && <span>· {r.asset.name}</span>}
                </RecordCardMeta>
              </RecordCard>
            ))}
          </RecordCardList>
        )}
      </div>

      <TransactionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} defaultDate={defaultDate} />
    </div>
  )
}
