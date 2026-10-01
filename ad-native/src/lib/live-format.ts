import type { LiveSessionDto } from '../api/laofus';

export function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function krw(v: number): string {
  return `₩${Math.round(v).toLocaleString('ko-KR')}`;
}

/** +1.2% / −3.4% (부호 포함, 마이너스는 − 기호) */
export function signedPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v).toFixed(digits);
  if (Number(abs) === 0) return `${abs}%`;
  return `${v > 0 ? '+' : '−'}${abs}%`;
}

export function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return h > 0 ? `${d}일 ${h}시간` : `${d}일`;
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  return m > 0 ? `${m}분` : '1분 미만';
}

/** "정규장 개장까지 1시간 44분" 같은 한 줄 안내. 계산할 일정이 없으면 null */
export function sessionHint(session: LiveSessionDto | null, nowMs: number): string | null {
  if (!session) return null;
  if (session.session === 'REGULAR' && session.endsAt) return `정규장 마감까지 ${formatRemaining(Date.parse(session.endsAt) - nowMs)}`;
  if (session.nextRegularOpenAt) return `정규장 개장까지 ${formatRemaining(Date.parse(session.nextRegularOpenAt) - nowMs)}`;
  if (session.next) return `${session.next.label}까지 ${formatRemaining(Date.parse(session.next.startsAt) - nowMs)}`;
  return null;
}

/** 가격 옆에 붙이는 "프리 · 3초 전" — 갱신이 한동안 실패했으면 "프리 · 지연" */
export function freshnessTag(session: LiveSessionDto | null, updatedAtMs: number, nowMs: number, stale: boolean): string {
  const sec = Math.max(0, Math.round((nowMs - updatedAtMs) / 1000));
  const age = stale ? '지연' : sec >= 60 ? `${Math.floor(sec / 60)}분 전` : `${sec}초 전`;
  return session ? `${session.shortLabel} · ${age}` : age;
}
