import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { axiosInstance, VR_API } from '@/shared/api'
import { useRunVrEngine } from '@/features/vr/api/hooks'
import { kst } from '@/features/vr/lib/format'
import { VrEngineStatusBar } from '@/features/vr/ui/VrEngineStatusBar'
import type { VrEventDto, VrEventsPage } from '@/features/vr/api/types'

type EventGroup = { key: string; runId: string | null; events: VrEventDto[] }

/** 연속된 같은 runId 이벤트를 하나의 실행 그룹으로 묶는다 (id DESC 입력) */
function groupEvents(events: VrEventDto[]): EventGroup[] {
  const groups: EventGroup[] = []
  for (const e of events) {
    const last = groups[groups.length - 1]
    if (e.runId && last && last.runId === e.runId) last.events.push(e)
    else groups.push({ key: `${e.runId ?? 'single'}-${e.id}`, runId: e.runId, events: [e] })
  }
  return groups
}

function levelColor(level: string): string {
  return level === 'error' ? 'text-destructive' : level === 'warn' ? 'text-amber-500' : 'text-muted-foreground'
}

function EventRow({ e }: { e: VrEventDto }) {
  return (
    <div className="flex gap-2.5 border-b py-1 text-xs">
      <span className="whitespace-nowrap text-muted-foreground">{kst(e.createdAt)}</span>
      <span className={`w-10 shrink-0 font-semibold ${levelColor(e.level)}`}>{e.level}</span>
      <span>{e.message}</span>
    </div>
  )
}

/** 엔진 실행 1회 단위 접이식 카드 */
function RunGroupCard({ group }: { group: EventGroup }) {
  const [open, setOpen] = useState(false)
  const asc = [...group.events].reverse()
  const start = asc[0]
  const end = asc[asc.length - 1]
  const worst = group.events.some((e) => e.level === 'error')
    ? 'error'
    : group.events.some((e) => e.level === 'warn')
      ? 'warn'
      : 'info'

  return (
    <div className="my-1.5 rounded-md border">
      <div className="flex cursor-pointer items-baseline gap-2.5 px-2.5 py-1.5" onClick={() => setOpen((v) => !v)}>
        <span className="whitespace-nowrap text-xs text-muted-foreground">{kst(start.createdAt)}</span>
        <span className="text-xs font-semibold">⚙ 실행</span>
        <span className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs ${levelColor(worst)}`}>
          {end.message}
        </span>
        <span className="text-xs text-muted-foreground">
          {group.events.length}건 {open ? '▾' : '▸'}
        </span>
      </div>
      {open && (
        <div className="px-2.5 pb-1.5">
          {asc.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function VrSystemPage() {
  const [events, setEvents] = useState<VrEventDto[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [level, setLevel] = useState('all')
  const [runLog, setRunLog] = useState<string[]>([])
  const runEngine = useRunVrEngine()
  const groups = useMemo(() => groupEvents(events), [events])

  const loadEvents = async (reset: boolean, lv = level, cur = cursor) => {
    try {
      const res = await axiosInstance.get<VrEventsPage>(VR_API.EVENTS, {
        params: { cursor: reset ? 0 : (cur ?? 0), level: lv },
      })
      const page = res.data.data
      setEvents((prev) => (reset ? page.events : [...prev, ...page.events]))
      setCursor(page.nextCursor)
    } catch {
      /* 무시 */
    }
  }

  useEffect(() => {
    loadEvents(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDryRun() {
    setRunLog(['--- dry-run 수동 실행 ---'])
    try {
      const res = await runEngine.mutateAsync()
      setRunLog((p) => [...p, ...res.data.lines])
      toast.success('Dry-run 실행 완료')
    } catch (e: any) {
      setRunLog((p) => [...p, `요청 오류: ${e?.response?.data?.message ?? e}`])
      toast.error('실행에 실패했습니다.')
    } finally {
      loadEvents(true)
    }
  }

  return (
    <div className="p-6">
      <PageHeader title="시스템" description="엔진 이벤트 로그 및 수동 실행(Dry-run)." />

      <div className="mt-4">
        <VrEngineStatusBar />
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4 text-xs text-muted-foreground">
        엔진은 백엔드 서버(NestJS) 안에서 매시 5분 cron으로 실행됩니다 — 백엔드가 꺼져 있으면 자동매매도 멈춥니다
        (pm2 <code>laofus-backend</code>로 상시 가동). 모드 전환은 pm2 env <code>VR_LIVE</code>, 스케줄 비활성은{' '}
        <code>VR_SCHEDULER=false</code>. 실제 주문이 나가는 LIVE 수동 실행은 이 화면에서 지원하지 않습니다 — 아래
        버튼은 항상 dry-run입니다.
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <strong className="text-sm">수동 실행</strong>
          <Button size="sm" variant="outline" onClick={handleDryRun} disabled={runEngine.isPending}>
            Dry-run
          </Button>
          {runEngine.isPending && <span className="text-xs text-muted-foreground">실행 중…</span>}
        </div>
        {runLog.length > 0 && (
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2.5 text-xs">
            {runLog.join('\n')}
          </pre>
        )}
      </div>

      <div className="mt-4 rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold">이벤트 전체</h2>
          <Select
            value={level}
            onValueChange={(v) => {
              setLevel(v)
              loadEvents(true, v)
            }}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="warn">warn</SelectItem>
              <SelectItem value="error">error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-[420px] overflow-y-auto text-sm">
          {groups.map((g) =>
            g.runId ? <RunGroupCard key={g.key} group={g} /> : <EventRow key={g.key} e={g.events[0]} />,
          )}
          {events.length === 0 && <p className="text-sm text-muted-foreground">이벤트 없음</p>}
        </div>
        {cursor !== null && (
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => loadEvents(false)}>
            더 보기
          </Button>
        )}
      </div>
    </div>
  )
}
