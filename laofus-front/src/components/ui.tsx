import { useEffect, useMemo, useState } from 'react'
import { useStatusContext } from '@/lib/StatusContext'
import type { StatusDto } from '@/lib/types'
import { kst } from '@/lib/types'

export function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  )
}

export function ErrorBanner({ status }: { status: StatusDto }) {
  const latestError = useMemo(() => {
    const err = status.events.find((e) => e.level === 'error')
    if (!err) return null
    const newerInfo = status.events.find((e) => e.level === 'info' && e.id > err.id)
    return newerInfo ? null : err
  }, [status])

  if (!latestError) return null
  return (
    <div
      className="card"
      style={{
        borderColor: 'var(--status-critical)',
        background: 'color-mix(in srgb, var(--status-critical) 8%, var(--surface-1))',
        marginBottom: 12,
      }}
    >
      <strong style={{ color: 'var(--status-critical)' }}>⚠ 엔진 오류</strong>
      <div style={{ fontSize: 13 }}>
        {kst(latestError.ts)} — {latestError.message}
      </div>
    </div>
  )
}

function fmtRemain(ms: number): string {
  if (ms <= 0) return '곧'
  const m = Math.floor(ms / 60_000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}시간 ${m % 60}분 후`
  if (m > 0) return `${m}분 ${Math.floor((ms % 60_000) / 1000)}초 후`
  return `${Math.floor(ms / 1000)}초 후`
}

/**
 * 실시간 엔진 모니터 바 — 백엔드 생존·모드·다음 실행 카운트다운·마지막 실행 결과.
 * 백엔드(=자동매매)가 꺼져 있으면 "연결 끊김"이 즉시 표시된다.
 */
export function EngineStatusBar() {
  const { status, connected, lastMessageAt } = useStatusContext()
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(id)
  }, [])

  if (!status) return null
  const live = status.engine.mode === 'live'
  const next = status.engine.nextRuns?.[0] ?? null
  const lastRun = status.engine.lastRun ?? null
  const running = status.engine.running ?? false
  const recvAgo = lastMessageAt ? Math.floor((Date.now() - lastMessageAt) / 1000) : null

  // 캘린더 today는 KST 날짜 기준 — 미래 마감 중 가장 가까운 세션 (보조 표기)
  const days = status.calendar
    ? [status.calendar.previousBusinessDay, status.calendar.today, status.calendar.nextBusinessDay]
    : []
  const closes = days
    .map((d) => (d?.regularMarket ? new Date(d.regularMarket.endTime) : null))
    .filter((c): c is Date => c !== null && c.getTime() > Date.now())
    .sort((a, b) => a.getTime() - b.getTime())
  const close = closes[0] ?? null

  return (
    <div className="card" style={{ marginBottom: 16, fontSize: 13 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center' }}>
        <span>
          <span style={{ color: status.engine.schedulerEnabled ? 'var(--status-good)' : 'var(--status-critical)' }}>
            ●
          </span>{' '}
          스케줄러 {status.engine.schedulerEnabled ? '활성' : '비활성'}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: live ? 'var(--status-critical)' : 'var(--baseline)',
            color: live ? '#fff' : 'var(--text-primary)',
          }}
        >
          {live ? 'LIVE' : 'DRY-RUN'}
        </span>
        {running && (
          <span className="pulse" style={{ color: 'var(--status-warning)', fontWeight: 600 }}>
            ⚙ 엔진 실행 중…
          </span>
        )}
        {!running && next && (
          <span style={{ color: 'var(--text-secondary)' }}>
            다음 실행 <strong style={{ color: 'var(--text-primary)' }}>{kst(next.at)}</strong> (
            {fmtRemain(new Date(next.at).getTime() - Date.now())})
            {close && ` · 마감 ${kst(close.toISOString())}`}
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            color: connected ? 'var(--status-good)' : 'var(--status-critical)',
            fontSize: 12,
          }}
        >
          {connected ? `● 실시간 (${recvAgo ?? '-'}초 전 수신)` : '○ 백엔드 연결 끊김 — 자동매매 중단 상태'}
        </span>
      </div>
      {(status.pendingOrders ?? []).length > 0 && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--grid)',
            color: 'var(--status-warning)',
            fontSize: 12,
          }}
        >
          ⏳ 개장 체결 대기{' '}
          {status.pendingOrders
            .map(
              (p) =>
                `${p.kind} ${p.side === 'BUY' ? '매수' : '매도'} ${
                  p.requestAmount ? `$${p.requestAmount}` : `${p.requestQuantity}주`
                }`
            )
            .join(', ')}{' '}
          — 다음 세션 개장 후 자동 회수
        </div>
      )}
      {lastRun && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--grid)',
            color:
              lastRun.level === 'error'
                ? 'var(--status-critical)'
                : lastRun.level === 'warn'
                  ? 'var(--status-warning)'
                  : 'var(--text-secondary)',
            fontSize: 12,
          }}
        >
          마지막 실행 {kst(lastRun.endedAt)} — {lastRun.summary}
        </div>
      )}
    </div>
  )
}
