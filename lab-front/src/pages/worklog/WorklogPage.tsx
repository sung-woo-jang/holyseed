import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateJobOption,
  useCreateWorklog,
  useDeleteJobOption,
  useDeleteWorklog,
  useUpdateWorklog,
  useUploadWorklogPhotos,
  useWorklogJobOptions,
  useWorklogMonth,
} from '@/features/worklog/api/hooks'
import type { PayStatus, Worklog, WorklogCategory, WorklogInput, WorklogPhoto } from '@/features/worklog/api/types'
import { CATEGORY_OPTIONS, calcWorklogAmount, getDailyWage, WITHHOLDING_RATE } from '@/features/worklog/lib/worklog-calc'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'
import { cn } from '@/shared/lib/utils'
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
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { FormSheet, FormSheetContent, FormSheetFooter, FormSheetHeader, FormSheetTitle } from '@/shared/ui/form-sheet'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RecordCard, RecordCardList, RecordCardMeta, RecordCardRow } from '@/shared/ui/record-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Separator } from '@/shared/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Textarea } from '@/shared/ui/textarea'
import { PageHeader } from '@/widgets/page-header'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

type SortKey = 'workDate' | 'title' | 'amount' | 'net'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }

const SORT_OPTIONS: { value: string; label: string; sort: Sort }[] = [
  { value: 'workDate:desc', label: '최신순', sort: { key: 'workDate', dir: 'desc' } },
  { value: 'workDate:asc', label: '오래된순', sort: { key: 'workDate', dir: 'asc' } },
  { value: 'title:asc', label: '현장명순', sort: { key: 'title', dir: 'asc' } },
  { value: 'amount:desc', label: '금액 높은순', sort: { key: 'amount', dir: 'desc' } },
  { value: 'amount:asc', label: '금액 낮은순', sort: { key: 'amount', dir: 'asc' } },
  { value: 'net:desc', label: '실수령 높은순', sort: { key: 'net', dir: 'desc' } },
  { value: 'net:asc', label: '실수령 낮은순', sort: { key: 'net', dir: 'asc' } },
]

function compareWorklogs(a: Worklog, b: Worklog, key: SortKey): number {
  switch (key) {
    case 'workDate':
      return a.workDate.localeCompare(b.workDate) || a.id - b.id
    case 'title':
      return a.title.localeCompare(b.title)
    case 'amount':
      return a.effectiveAmount - b.effectiveAmount
    case 'net':
      return a.netAmount - b.netAmount
  }
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; dir: 'asc' | 'desc' }
  onSort: (sortKey: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className={cn('cursor-pointer select-none', className)} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={cn('size-3.5', !active && 'text-muted-foreground/50')} />
      </span>
    </TableHead>
  )
}

const PAY_STATUS_META: Record<
  PayStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  RECEIVED: { label: '✅ 수령완료', variant: 'default' },
  EXPECTED: { label: '🟠 예상(미수령)', variant: 'secondary' },
  UNPAID: { label: '🟡 미수령', variant: 'destructive' },
  DAYOFF: { label: '휴무', variant: 'outline' },
}

interface FormState {
  title: string
  workDate: string
  category: WorklogCategory
  startTime: string
  endTime: string
  breakHours: string
  jobs: string[]
  payStatus: PayStatus
  dailyWage: string
  amountOverride: string
  address: string
  memo: string
  photos: WorklogPhoto[]
}

const emptyForm = (date: string): FormState => ({
  title: '',
  workDate: date,
  category: 'INTERIOR',
  startTime: '08:00',
  endTime: '17:00',
  breakHours: '1',
  jobs: [],
  payStatus: 'EXPECTED',
  dailyWage: String(getDailyWage(date)),
  amountOverride: '',
  address: '',
  memo: '',
  photos: [],
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
  const uploadPhotos = useUploadWorklogPhotos()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: jobOptionsRes } = useWorklogJobOptions()
  const jobOptions = jobOptionsRes?.data ?? []
  const createJobOption = useCreateJobOption()
  const deleteJobOption = useDeleteJobOption()
  const [newJobName, setNewJobName] = useState('')

  async function addJobOption() {
    const name = newJobName.trim()
    if (!name) return
    try {
      await createJobOption.mutateAsync(name)
      set('jobs', [...form.jobs, name])
      setNewJobName('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '업무 추가에 실패했습니다.')
    }
  }

  async function removeJobOption(id: number, name: string) {
    try {
      await deleteJobOption.mutateAsync(id)
      set('jobs', form.jobs.filter((j) => j !== name))
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '업무 삭제에 실패했습니다.')
    }
  }

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
              category: editing.category,
              startTime: editing.startTime ?? '',
              endTime: editing.endTime ?? '',
              breakHours: String(editing.breakHours),
              jobs: editing.jobs,
              payStatus: editing.payStatus,
              dailyWage: String(editing.dailyWage),
              amountOverride: editing.amountOverride !== null ? String(editing.amountOverride) : '',
              address: editing.address ?? '',
              memo: editing.memo ?? '',
              photos: editing.photos ?? [],
            }
          : emptyForm(defaultDate)
      )
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    if (form.photos.length + files.length > 5) {
      toast.error('사진은 최대 5장까지 등록할 수 있습니다.')
      return
    }
    try {
      const res = await uploadPhotos.mutateAsync(files)
      set('photos', [...form.photos, ...res.data.photos])
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '사진 업로드에 실패했습니다.')
    }
  }

  function removePhoto(url: string) {
    set(
      'photos',
      form.photos.filter((p) => p.url !== url)
    )
  }

  const isCoupang = form.category === 'COUPANG'
  const preview = calcWorklogAmount({
    startTime: form.startTime || undefined,
    endTime: form.endTime || undefined,
    breakHours: parseFloat(form.breakHours) || 0,
    dailyWage: parseInt(form.dailyWage, 10) || 0,
    isDayoff: form.payStatus === 'DAYOFF',
    isCoupang,
    amountOverride: parseInt(form.amountOverride, 10) || 0,
  })
  const effective = form.amountOverride !== '' ? parseInt(form.amountOverride, 10) || 0 : preview
  // 쿠팡은 이미 세후 확정 금액이라 원천징수를 다시 적용하지 않음
  const net = isCoupang ? effective : Math.round(effective * (1 - WITHHOLDING_RATE))

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: WorklogInput = {
      title: form.title,
      workDate: form.workDate,
      category: form.category,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      breakHours: parseFloat(form.breakHours) || 0,
      jobs: form.jobs,
      payStatus: form.payStatus,
      dailyWage: parseInt(form.dailyWage, 10) || 0,
      amountOverride: form.amountOverride !== '' ? parseInt(form.amountOverride, 10) : null,
      address: form.address || undefined,
      memo: form.memo || undefined,
      photos: form.photos,
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
    <FormSheet open={open} onOpenChange={(v) => !v && onClose()}>
      <FormSheetContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <FormSheetHeader>
          <FormSheetTitle>{editing ? '근무 기록 수정' : '근무 기록 추가'}</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>현장명 (여러 곳이면 / 구분)</Label>
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                placeholder="송도 / 학익"
              />
            </div>
            <div className="space-y-2">
              <Label>분류</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v as WorklogCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {!isCoupang && (
              <>
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
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.breakHours}
                    onChange={(e) => set('breakHours', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>일급여 (원)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="10000"
                    value={form.dailyWage}
                    onChange={(e) => set('dailyWage', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {!isCoupang && (
            <div className="space-y-2">
              <Label>업무</Label>
              <div className="flex flex-wrap items-center gap-4">
                {jobOptions?.map((opt) => (
                  <span key={opt.id} className="group flex items-center gap-1 text-sm">
                    <label className="flex items-center gap-1.5">
                      <Checkbox
                        checked={form.jobs.includes(opt.name)}
                        onCheckedChange={(checked) =>
                          set('jobs', checked ? [...form.jobs, opt.name] : form.jobs.filter((j) => j !== opt.name))
                        }
                      />
                      {opt.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeJobOption(opt.id, opt.name)}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      aria-label={`${opt.name} 삭제`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addJobOption()
                    }
                  }}
                  placeholder="새 업무 (예: 타일)"
                  className="h-8 max-w-40 text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={addJobOption} disabled={!newJobName.trim()}>
                  추가
                </Button>
              </div>
            </div>
          )}

          {!isCoupang && (
            <div className="space-y-2">
              <Label>주소</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea rows={2} value={form.memo} onChange={(e) => set('memo', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>사진 ({form.photos.length}/5)</Label>
            <div className="flex flex-wrap gap-2">
              {form.photos.map((p) => (
                <div key={p.url} className="group relative size-16 overflow-hidden rounded-md border">
                  <img src={p.url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.url)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="사진 삭제"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {form.photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPhotos.isPending}
                  className="text-muted-foreground hover:bg-accent flex size-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed disabled:opacity-50"
                >
                  <ImagePlus className="size-4" />
                  <span className="text-[10px]">{uploadPhotos.isPending ? '업로드 중' : '추가'}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          <div className="bg-muted/40 rounded-md border p-3 text-sm">
            {!isCoupang && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">계산 금액</span>
                <b className="tabular-nums">{won(preview)}</b>
              </div>
            )}
            <div className={cn('flex items-center justify-between gap-3', !isCoupang && 'mt-2')}>
              <span className="text-muted-foreground">{isCoupang ? '실수령액 (세후 확정)' : '실수령 오버라이드'}</span>
              <Input
                type="number"
                className="h-8 w-36 text-right"
                placeholder={isCoupang ? '82380' : '(선택)'}
                required={isCoupang}
                value={form.amountOverride}
                onChange={(e) => set('amountOverride', e.target.value)}
              />
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span className="text-muted-foreground">{isCoupang ? '실수령 (공제 없음)' : '실수령 (3.3% 공제)'}</span>
              <b className="tabular-nums">{won(net)}</b>
            </div>
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

export default function WorklogPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Worklog | null>(null)

  const { data: res, isLoading } = useWorklogMonth(year, month)
  const deleteWorklog = useDeleteWorklog()
  const [sort, setSort] = useState<Sort>({ key: 'workDate', dir: 'desc' })
  const isDesktop = useIsDesktopNav()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const records = res?.data?.records ?? []
  const summary = res?.data?.summary

  const sortedRecords = useMemo(() => {
    const sign = sort.dir === 'asc' ? 1 : -1
    return [...records].sort((a, b) => sign * compareWorklogs(a, b, sort.key))
  }, [records, sort])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [year, month])

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = sortedRecords.length > 0 && sortedRecords.every((r) => selectedIds.has(r.id))

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(sortedRecords.map((r) => r.id)))
  }

  const selectedSum = useMemo(
    () =>
      records
        .filter((r) => selectedIds.has(r.id))
        .reduce(
          (acc, r) => ({ amount: acc.amount + r.effectiveAmount, net: acc.net + r.netAmount }),
          { amount: 0, net: 0 }
        ),
    [records, selectedIds]
  )

  function handleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  function openEdit(r: Worklog) {
    setEditing(r)
    setDialogOpen(true)
  }

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
    <div className={cn('p-6', selectedIds.size > 0 && 'pb-24')}>
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
          <div className="bg-card rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">근무일수</p>
            <p className="mt-1 text-lg font-semibold">{summary.workDays}일</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">합계 (세전)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalAmount)}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">실수령 합계</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{won(summary.totalNet)}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-muted-foreground text-xs">수령 / 미수령</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {won(summary.receivedNet)}{' '}
              <span className="text-muted-foreground text-sm font-normal">/ {won(summary.pendingNet)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="bg-card mt-4 rounded-lg border p-4">
        {!isDesktop && !isLoading && (
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={toggleSelectAll} disabled={sortedRecords.length === 0}>
              {allSelected ? '선택 해제' : '전체 선택'}
            </Button>
            <Select
              value={`${sort.key}:${sort.dir}`}
              onValueChange={(v) => {
                const opt = SORT_OPTIONS.find((o) => o.value === v)
                if (opt) setSort(opt.sort)
              }}
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">불러오는 중…</p>
        ) : isDesktop ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="전체 선택" />
                </TableHead>
                <SortableHead label="날짜" sortKey="workDate" sort={sort} onSort={handleSort} />
                <SortableHead label="현장" sortKey="title" sort={sort} onSort={handleSort} />
                <TableHead>근무시간</TableHead>
                <TableHead>업무</TableHead>
                <SortableHead label="금액" sortKey="amount" sort={sort} onSort={handleSort} className="text-right" />
                <SortableHead label="실수령" sortKey="net" sort={sort} onSort={handleSort} className="text-right" />
                <TableHead>수령</TableHead>
                <TableHead>사진</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-muted-foreground text-center">
                    이 달의 기록이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {sortedRecords.map((r) => {
                const meta = PAY_STATUS_META[r.payStatus]
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(r.id)}
                        onCheckedChange={() => toggleSelect(r.id)}
                        aria-label="선택"
                      />
                    </TableCell>
                    <TableCell>{r.workDate.slice(5)}</TableCell>
                    <TableCell className="max-w-40 truncate" title={r.memo ?? undefined}>
                      {r.category === 'COUPANG' && (
                        <Badge variant="outline" className="mr-1.5 text-[10px]">
                          쿠팡
                        </Badge>
                      )}
                      {r.title}
                    </TableCell>
                    <TableCell>
                      {r.payStatus === 'DAYOFF'
                        ? '휴무'
                        : r.startTime && r.endTime
                          ? `${r.startTime}~${r.endTime}`
                          : '—'}
                    </TableCell>
                    <TableCell>{r.jobs.join(', ') || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {won(r.effectiveAmount)}
                      {r.amountOverride !== null && <span className="text-muted-foreground ml-1 text-xs">*</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{won(r.netAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.photos.length > 0 ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                          <ImagePlus className="size-3.5" />
                          {r.photos.length}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(r)}>
                          <Pencil className="text-muted-foreground size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <Trash2 className="text-muted-foreground size-4" />
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
        ) : (
          <RecordCardList>
            {sortedRecords.length === 0 && (
              <p className="text-muted-foreground text-center text-sm">이 달의 기록이 없습니다.</p>
            )}
            {sortedRecords.map((r) => {
              const meta = PAY_STATUS_META[r.payStatus]
              return (
                <RecordCard key={r.id} onClick={() => openEdit(r)}>
                  <RecordCardRow>
                    <div className="flex min-w-0 items-start gap-2">
                      <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                        <Checkbox
                          checked={selectedIds.has(r.id)}
                          onCheckedChange={() => toggleSelect(r.id)}
                          aria-label="선택"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{r.workDate.slice(5)}</span>
                          <Badge variant={meta.variant} className="text-[10px]">
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate font-medium">
                          {r.category === 'COUPANG' && (
                            <Badge variant="outline" className="mr-1.5 text-[10px]">
                              쿠팡
                            </Badge>
                          )}
                          {r.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">{won(r.netAmount)}</p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {won(r.effectiveAmount)}
                          {r.amountOverride !== null && '*'}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-9">
                            <Trash2 className="text-muted-foreground size-4" />
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
                    <span>
                      {r.payStatus === 'DAYOFF'
                        ? '휴무'
                        : r.startTime && r.endTime
                          ? `${r.startTime}~${r.endTime}`
                          : '—'}
                    </span>
                    {r.jobs.length > 0 && <span>· {r.jobs.join(', ')}</span>}
                    {r.photos.length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <ImagePlus className="size-3.5" />
                        {r.photos.length}
                      </span>
                    )}
                  </RecordCardMeta>
                </RecordCard>
              )
            })}
          </RecordCardList>
        )}
        <p className="text-muted-foreground mt-2 text-xs">* 표시는 수동 오버라이드된 금액 (실수령액 우선 원칙)</p>
      </div>

      <WorklogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        defaultDate={defaultDate}
      />

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 text-sm">
            <Badge className="min-w-8 rounded-lg">{selectedIds.size}</Badge>
            <span className="text-muted-foreground">건 선택</span>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-muted-foreground">
              세전 <b className="text-foreground tabular-nums">{won(selectedSum.amount)}</b>
            </span>
            <span className="text-muted-foreground">
              실수령 <b className="text-foreground tabular-nums">{won(selectedSum.net)}</b>
            </span>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setSelectedIds(new Set())}
              aria-label="선택 해제"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
