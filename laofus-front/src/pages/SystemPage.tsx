import { useEffect, useMemo, useState } from 'react'
import { EngineStatusBar, ErrorBanner } from '@/components/ui'
import type { EventDto } from '@/lib/types'
import { api, kst } from '@/lib/types'
import { useStatus } from '@/lib/useStatus'

type EventGroup = { key: string; runId: string | null; events: EventDto[] }

/** 연속된 같은 runId 이벤트를 하나의 실행 그룹으로 묶는다 (id DESC 입력) */
function groupEvents(events: EventDto[]): EventGroup[] {
  const groups: EventGroup[] = []
  for (const e of events) {
    const last = groups[groups.length - 1]
    if (e.runId && last && last.runId === e.runId) last.events.push(e)
    else groups.push({ key: `${e.runId ?? 'single'}-${e.id}`, runId: e.runId, events: [e] })
  }
  return groups
}

function levelColor(level: string): string {
  return level === 'error'
    ? 'var(--status-critical)'
    : level === 'warn'
      ? 'var(--status-warning)'
      : 'var(--text-secondary)'
}

function EventRow({ e }: { e: EventDto }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid var(--grid)' }}>
      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{kst(e.ts)}</span>
      <span style={{ fontWeight: 600, width: 38, flexShrink: 0, color: levelColor(e.level) }}>{e.level}</span>
      <span>{e.message}</span>
    </div>
  )
}

/** 엔진 실행 1회 단위 접이식 카드 */
function RunGroupCard({ group }: { group: EventGroup }) {
  const [open, setOpen] = useState(false)
  const asc = [...group.events].reverse() // 시간순
  const start = asc[0]
  const end = asc[asc.length - 1]
  const worst = group.events.some((e) => e.level === 'error')
    ? 'error'
    : group.events.some((e) => e.level === 'warn')
      ? 'warn'
      : 'info'
  const mode = /\((.+?)\)/.exec(start.message)?.[1] ?? ''
  return (
    <div style={{ border: '1px solid var(--grid)', borderRadius: 8, margin: '6px 0' }}>
      <div
        style={{ display: 'flex', gap: 10, padding: '6px 10px', cursor: 'pointer', alignItems: 'baseline' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>{kst(start.ts)}</span>
        <span style={{ fontWeight: 600, fontSize: 12 }}>⚙ 실행{mode ? ` (${mode})` : ''}</span>
        <span
          style={{
            color: levelColor(worst),
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {end.message}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {group.events.length}건 {open ? '▾' : '▸'}
        </span>
      </div>
      {open && (
        <div style={{ padding: '0 10px 6px', fontSize: 12 }}>
          {asc.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SystemPage() {
  const { status } = useStatus()
  const [runLog, setRunLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [events, setEvents] = useState<EventDto[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [level, setLevel] = useState('all')
  const groups = useMemo(() => groupEvents(events), [events])

  const loadEvents = async (reset: boolean, lv = level) => {
    const c = reset ? 0 : (cursor ?? 0)
    try {
      const d = await api<{ events: EventDto[]; nextCursor: number | null }>(
        `/api/laofus/events?cursor=${c}&level=${lv}`
      )
      setEvents((prev) => (reset ? d.events : [...prev, ...d.events]))
      setCursor(d.nextCursor)
    } catch {
      /* 무시 */
    }
  }
  useEffect(() => {
    loadEvents(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // SSE로 새 이벤트가 오면 (엔진 실행 등) 첫 페이지 자동 갱신
  const latestEventId = status?.events?.[0]?.id
  useEffect(() => {
    if (latestEventId) loadEvents(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEventId])

  async function manualRun(live: boolean) {
    if (live && !confirm('실제 주문이 나갑니다. LIVE로 실행할까요?')) return
    setRunning(true)
    setRunLog([`--- ${live ? 'LIVE' : 'dry-run'} 수동 실행 ---`])
    try {
      const d = await api<{ lines: string[] }>('/api/laofus/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live }),
      })
      setRunLog((p) => [...p, ...d.lines])
    } catch (e) {
      setRunLog((p) => [...p, `요청 오류: ${e}`])
    } finally {
      setRunning(false)
      loadEvents(true)
    }
  }

  if (!status)
    return (
      <main className="wrap">
        <p style={{ color: 'var(--text-muted)' }}>불러오는 중…</p>
      </main>
    )

  return (
    <main className="wrap">
      <ErrorBanner status={status} />
      <EngineStatusBar />

      <div className="card" style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
        엔진은 백엔드 서버(NestJS) 안에서 cron으로 실행됨 — <strong>백엔드가 꺼져 있으면 자동매매도 안 됨</strong>{' '}
        (pm2 <code>laofus-backend</code>로 상시 가동). KST 04:30(여름)/05:30(겨울), 마감 20~35분 전 창 검증. 모드
        전환은 pm2 env <code>LAOFUS_LIVE</code>, 스케줄 비활성은 <code>LAOFUS_SCHEDULER=false</code>.
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: runLog.length ? 10 : 0 }}>
          <strong style={{ fontSize: 13 }}>수동 실행</strong>
          <button onClick={() => manualRun(false)} disabled={running}>
            Dry-run
          </button>
          <button className="danger" onClick={() => manualRun(true)} disabled={running}>
            LIVE 실행
          </button>
          {running && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>실행 중…</span>}
        </div>
        {runLog.length > 0 && (
          <pre
            style={{
              background: 'var(--page)',
              border: '1px solid var(--grid)',
              borderRadius: 8,
              padding: 10,
              fontSize: 12,
              maxHeight: 220,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {runLog.join('\n')}
          </pre>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h2 style={{ fontSize: 15 }}>이벤트 전체</h2>
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value)
              loadEvents(true, e.target.value)
            }}
            style={{
              font: 'inherit',
              fontSize: 12,
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '2px 6px',
            }}
          >
            <option value="all">전체</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto', fontSize: 13 }}>
          {groups.map((g) =>
            g.runId ? <RunGroupCard key={g.key} group={g} /> : <EventRow key={g.key} e={g.events[0]} />
          )}
          {events.length === 0 && <p style={{ color: 'var(--text-muted)' }}>이벤트 없음</p>}
        </div>
        {cursor !== null && (
          <button onClick={() => loadEvents(false)} style={{ marginTop: 8, fontSize: 12 }}>
            더 보기
          </button>
        )}
      </div>
    </main>
  )
}
