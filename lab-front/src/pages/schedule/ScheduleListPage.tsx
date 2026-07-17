import { useMemo, useState } from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useAllSchedules } from '@/features/schedule/api/hooks'
import type { Schedule } from '@/features/schedule/api/types'
import { ScheduleDialog } from '@/features/schedule/ui/ScheduleDialog'
import { TAG_PRESETS, tagColor } from '@/features/schedule/lib/tag-colors'
import { cn } from '@/shared/lib/utils'

const fmt = (iso: string, allDay: boolean) => {
  const d = new Date(iso)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return allDay ? date : `${date} ${d.toTimeString().slice(0, 5)}`
}

export default function ScheduleListPage() {
  const { data: res, isLoading } = useAllSchedules()
  const [tagFilter, setTagFilter] = useState('전체')
  const [scope, setScope] = useState<'upcoming' | 'all'>('upcoming')
  const [editing, setEditing] = useState<Schedule | null>(null)

  const schedules = useMemo(() => {
    let list = res?.data ?? []
    if (tagFilter !== '전체') list = list.filter((s) => s.tags.includes(tagFilter))
    if (scope === 'upcoming') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      list = list.filter((s) => new Date(s.endAt ?? s.startAt) >= today)
    }
    return list
  }, [res, tagFilter, scope])

  return (
    <div className="p-6">
      <PageHeader title="일정 리스트" description="태그·기간 필터로 일정을 조회합니다." />

      <div className="mt-6 flex gap-3">
        <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">다가오는 일정</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">모든 태그</SelectItem>
            {TAG_PRESETS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>태그</TableHead>
                <TableHead>링크</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    일정이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {fmt(s.startAt, s.allDay)}
                    {s.endAt && ` ~ ${fmt(s.endAt, true)}`}
                  </TableCell>
                  <TableCell>{s.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map((t) => (
                        <Badge key={t} variant="outline" className={cn('border-0', tagColor(t))}>
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary">
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(s)}>
                      <Pencil className="size-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ScheduleDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        editing={editing}
        defaultDate={new Date().toISOString().slice(0, 10)}
      />
    </div>
  )
}
