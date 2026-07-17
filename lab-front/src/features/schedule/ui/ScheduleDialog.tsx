import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useCreateSchedule, useDeleteSchedule, useUpdateSchedule } from '../api/hooks'
import type { Schedule, ScheduleInput } from '../api/types'
import { TAG_PRESETS } from '../lib/tag-colors'

interface FormState {
  title: string
  date: string
  time: string
  endDate: string
  allDay: boolean
  tags: string[]
  link: string
  memo: string
}

function toForm(editing: Schedule | null, defaultDate: string): FormState {
  if (!editing) {
    return { title: '', date: defaultDate, time: '', endDate: '', allDay: true, tags: [], link: '', memo: '' }
  }
  const start = new Date(editing.startAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    title: editing.title,
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    time: editing.allDay ? '' : `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endDate: editing.endAt ? new Date(editing.endAt).toISOString().slice(0, 10) : '',
    allDay: editing.allDay,
    tags: editing.tags,
    link: editing.link ?? '',
    memo: editing.memo ?? '',
  }
}

export function ScheduleDialog({
  open,
  onClose,
  editing,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  editing: Schedule | null
  defaultDate: string
}) {
  const [form, setForm] = useState<FormState>(toForm(null, defaultDate))
  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setForm(toForm(editing, defaultDate))
  }

  const create = useCreateSchedule()
  const update = useUpdateSchedule()
  const remove = useDeleteSchedule()

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const startAt =
      form.allDay || !form.time ? `${form.date}T00:00:00+09:00` : `${form.date}T${form.time}:00+09:00`
    const input: ScheduleInput = {
      title: form.title,
      startAt,
      endAt: form.endDate ? `${form.endDate}T23:59:59+09:00` : null,
      allDay: form.allDay || !form.time,
      tags: form.tags,
      link: form.link || undefined,
      memo: form.memo || undefined,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input })
        toast.success('일정이 수정되었습니다.')
      } else {
        await create.mutateAsync(input)
        toast.success('일정이 등록되었습니다.')
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '저장에 실패했습니다.')
    }
  }

  async function handleDelete() {
    if (!editing) return
    try {
      await remove.mutateAsync(editing.id)
      toast.success('일정이 삭제되었습니다.')
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? '삭제에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '일정 수정' : '일정 등록'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>제목</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>종료일 (기간 일정)</Label>
              <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={form.allDay} onCheckedChange={(v) => set('allDay', v)} />
              <Label>종일</Label>
            </div>
            {!form.allDay && (
              <Input type="time" className="w-32" value={form.time} onChange={(e) => set('time', e.target.value)} />
            )}
          </div>
          <div className="space-y-2">
            <Label>태그</Label>
            <div className="grid grid-cols-4 gap-2">
              {TAG_PRESETS.map((tag) => (
                <label key={tag} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={form.tags.includes(tag)}
                    onCheckedChange={(checked) =>
                      set('tags', checked ? [...form.tags, tag] : form.tags.filter((t) => t !== tag))
                    }
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>링크</Label>
            <Input type="url" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label>메모</Label>
            <Textarea rows={2} value={form.memo} onChange={(e) => set('memo', e.target.value)} />
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {editing ? (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
                삭제
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {editing ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
