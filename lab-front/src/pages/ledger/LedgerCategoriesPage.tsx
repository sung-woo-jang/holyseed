import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { FormSheet, FormSheetContent, FormSheetFooter, FormSheetHeader, FormSheetTitle } from '@/shared/ui/form-sheet'
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
  useCreateLedgerCategory,
  useDeleteLedgerCategory,
  useLedgerCategories,
  useUpdateLedgerCategory,
} from '@/features/ledger/api/hooks'
import type { LedgerCategory, LedgerCategoryInput, LedgerCostType, LedgerType } from '@/features/ledger/api/types'

const COLORS = ['#3182F6', '#0AB39C', '#F59E0B', '#EF4444', '#A78BFA', '#EC4899', '#06B6D4', '#8B5CF6']

interface FormState {
  name: string
  icon: string
  color: string
  type: LedgerType
  costType: LedgerCostType | ''
}

const emptyForm = (type: LedgerType): FormState => ({ name: '', icon: '💰', color: COLORS[0], type, costType: '' })

function CategoryDialog({
  open,
  onClose,
  editing,
  defaultType,
}: {
  open: boolean
  onClose: () => void
  editing: LedgerCategory | null
  defaultType: LedgerType
}) {
  const [form, setForm] = useState<FormState>(emptyForm(defaultType))
  const create = useCreateLedgerCategory()
  const update = useUpdateLedgerCategory()

  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(
        editing
          ? { name: editing.name, icon: editing.icon, color: editing.color, type: editing.type, costType: editing.costType ?? '' }
          : emptyForm(defaultType),
      )
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: LedgerCategoryInput = {
      name: form.name,
      icon: form.icon,
      color: form.color,
      type: form.type,
      costType: form.type === 'EXPENSE' ? form.costType || null : null,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('카테고리가 수정되었습니다.')
      } else {
        await create.mutateAsync(input)
        toast.success('카테고리가 추가되었습니다.')
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '저장에 실패했습니다.')
    }
  }

  return (
    <FormSheet open={open} onOpenChange={(v) => !v && onClose()}>
      <FormSheetContent className="max-w-md">
        <FormSheetHeader>
          <FormSheetTitle>{editing ? '카테고리 수정' : '카테고리 추가'}</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>구분</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v as LedgerType)}>
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
              <Label>아이콘 (이모지)</Label>
              <Input value={form.icon} onChange={(e) => set('icon', e.target.value)} maxLength={4} className="text-center text-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>이름</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="주거비" />
          </div>
          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-7 rounded-full ring-offset-2"
                  style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined, outline: form.color === c ? '2px solid var(--foreground)' : undefined }}
                  onClick={() => set('color', c)}
                />
              ))}
            </div>
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

function CategoryGrid({
  title,
  categories,
  type,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string
  categories: LedgerCategory[]
  type: LedgerType
  onAdd: (type: LedgerType) => void
  onEdit: (c: LedgerCategory) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Button variant="outline" size="sm" onClick={() => onAdd(type)}>
          <Plus className="mr-1 size-3.5" /> 추가
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">카테고리가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="group relative flex items-center gap-2 rounded-lg border p-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: `${c.color}22` }}>
                {c.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                {c.costType && (
                  <Badge variant="secondary" className="mt-0.5 text-[10px]">
                    {c.costType === 'FIXED' ? '고정비' : '변동비'}
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="size-6" onClick={() => onEdit(c)}>
                  <Pencil className="size-3.5 text-muted-foreground" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-6">
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>카테고리를 삭제할까요?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(c.id)}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LedgerCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LedgerCategory | null>(null)
  const [defaultType, setDefaultType] = useState<LedgerType>('EXPENSE')
  const { data: categoriesRes } = useLedgerCategories()
  const categories = categoriesRes?.data ?? []
  const deleteCategory = useDeleteLedgerCategory()

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')

  function openAdd(type: LedgerType) {
    setEditing(null)
    setDefaultType(type)
    setDialogOpen(true)
  }

  function openEdit(c: LedgerCategory) {
    setEditing(c)
    setDefaultType(c.type)
    setDialogOpen(true)
  }

  async function handleDelete(id: number) {
    try {
      await deleteCategory.mutateAsync(id)
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader title="카테고리" description="거래장부에서 쓸 카테고리를 관리해요" />

      <div className="mt-6 space-y-4">
        <CategoryGrid title="지출 카테고리" categories={expenseCategories} type="EXPENSE" onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} />
        <CategoryGrid title="수입 카테고리" categories={incomeCategories} type="INCOME" onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      <CategoryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} defaultType={defaultType} />
    </div>
  )
}
