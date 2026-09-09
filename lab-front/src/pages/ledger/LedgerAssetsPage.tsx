import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
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
import { useCreateLedgerAsset, useDeleteLedgerAsset, useLedgerAssets, useUpdateLedgerAsset } from '@/features/ledger/api/hooks'
import type { LedgerAsset, LedgerAssetInput, LedgerAssetType } from '@/features/ledger/api/types'

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

const ASSET_TYPE_META: Record<LedgerAssetType, string> = {
  BANK: '은행 계좌',
  CARD: '카드',
  CASH: '현금',
  INVESTMENT: '투자',
  OTHER: '기타',
}

interface FormState {
  name: string
  type: LedgerAssetType
  balance: string
}

const emptyForm = (): FormState => ({ name: '', type: 'BANK', balance: '0' })

function AssetDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: LedgerAsset | null }) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const create = useCreateLedgerAsset()
  const update = useUpdateLedgerAsset()

  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(editing ? { name: editing.name, type: editing.type, balance: String(editing.balance) } : emptyForm())
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: LedgerAssetInput = { name: form.name, type: form.type, balance: parseInt(form.balance, 10) || 0 }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('자산이 수정되었습니다.')
      } else {
        await create.mutateAsync(input)
        toast.success('자산이 추가되었습니다.')
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
          <FormSheetTitle>{editing ? '자산 수정' : '자산 추가'}</FormSheetTitle>
        </FormSheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>이름</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="신한은행" />
          </div>
          <div className="space-y-2">
            <Label>종류</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v as LedgerAssetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_META).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{editing ? '잔액 (직접 수정)' : '시작 잔액'}</Label>
            <Input type="number" value={form.balance} onChange={(e) => set('balance', e.target.value)} />
            {!editing && <p className="text-xs text-muted-foreground">이후 거래 등록 시 자동으로 반영돼요.</p>}
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

export default function LedgerAssetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LedgerAsset | null>(null)
  const { data: assetsRes, isLoading } = useLedgerAssets()
  const assets = assetsRes?.data ?? []
  const deleteAsset = useDeleteLedgerAsset()
  const isDesktop = useIsDesktopNav()

  async function handleDelete(id: number) {
    try {
      await deleteAsset.mutateAsync(id)
      toast.success('삭제되었습니다.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="자산"
        description="거래에 연결할 계좌·카드 등을 관리해요"
        action={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-1 size-4" /> 자산 추가
          </Button>
        }
      />

      <div className="mt-6 rounded-lg border bg-card p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : isDesktop ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>종류</TableHead>
                <TableHead className="text-right">잔액</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    등록된 자산이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ASSET_TYPE_META[a.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{won(a.balance)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => {
                          setEditing(a)
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
                            <AlertDialogTitle>자산을 삭제할까요?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(a.id)}>삭제</AlertDialogAction>
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
            {assets.length === 0 && <p className="text-center text-sm text-muted-foreground">등록된 자산이 없습니다.</p>}
            {assets.map((a) => (
              <RecordCard
                key={a.id}
                onClick={() => {
                  setEditing(a)
                  setDialogOpen(true)
                }}
              >
                <RecordCardRow>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.name}</p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1" onClick={(e) => e.stopPropagation()}>
                    <p className="font-semibold tabular-nums">{won(a.balance)}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mt-1 -mr-2 size-9">
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>자산을 삭제할까요?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a.id)}>삭제</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </RecordCardRow>
                <RecordCardMeta>
                  <span>{ASSET_TYPE_META[a.type]}</span>
                </RecordCardMeta>
              </RecordCard>
            ))}
          </RecordCardList>
        )}
      </div>

      <AssetDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
    </div>
  )
}
