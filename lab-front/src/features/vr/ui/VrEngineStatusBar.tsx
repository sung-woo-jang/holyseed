import { Badge } from '@/shared/ui/badge'
import { useVrStatus } from '@/features/vr/api/hooks'

const kst = (iso: string): string =>
  new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function fmtRemain(ms: number): string {
  if (ms <= 0) return '곧'
  const m = Math.floor(ms / 60_000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}시간 ${m % 60}분 후`
  return `${m}분 후`
}

const SESSION_LABEL: Record<string, string> = {
  PRE: '프리마켓',
  REGULAR: '정규장',
  AFTER: '애프터마켓',
}

/**
 * VR 엔진(자동매매) 상태바 — laofus EngineStatusBar와 동일한 정보를 10초 폴링으로 표시.
 * (VR은 SSE 대신 폴링: /vr/stream은 JWT 인증이 필요한데 브라우저 EventSource는 커스텀 헤더를
 * 못 보내서, 인증 모델을 바꾸지 않는 선에서 폴링으로 처리)
 */
export function VrEngineStatusBar() {
  const { data: res } = useVrStatus()
  const status = res?.data

  if (!status) return null
  const live = status.engine.mode === 'live'
  const latestError = status.events.find((e) => e.level === 'error')

  return (
    <div className="rounded-lg border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-1.5">
          <span className={status.engine.schedulerEnabled ? 'text-emerald-500' : 'text-destructive'}>●</span>
          스케줄러 {status.engine.schedulerEnabled ? '활성' : '비활성'}
        </span>
        <Badge variant={live ? 'destructive' : 'secondary'}>{live ? 'LIVE' : 'DRY-RUN'}</Badge>
        {status.activeSession && <Badge variant="outline">{SESSION_LABEL[status.activeSession]}</Badge>}
        {status.engine.running ? (
          <span className="font-medium text-amber-500">⚙ 엔진 실행 중…</span>
        ) : (
          <span className="text-muted-foreground">
            다음 실행 <strong className="text-foreground">{kst(status.engine.nextRun)}</strong> (
            {fmtRemain(new Date(status.engine.nextRun).getTime() - Date.now())})
          </span>
        )}
      </div>
      {status.engine.lastRun && (
        <div
          className={`mt-2 border-t pt-2 text-xs ${
            status.engine.lastRun.level === 'error'
              ? 'text-destructive'
              : status.engine.lastRun.level === 'warn'
                ? 'text-amber-500'
                : 'text-muted-foreground'
          }`}
        >
          마지막 실행 {kst(status.engine.lastRun.endedAt)} — {status.engine.lastRun.summary}
        </div>
      )}
      {latestError && (
        <div className="mt-2 border-t pt-2 text-xs text-destructive">
          ⚠ {kst(latestError.createdAt)} — {latestError.message}
        </div>
      )}
    </div>
  )
}
