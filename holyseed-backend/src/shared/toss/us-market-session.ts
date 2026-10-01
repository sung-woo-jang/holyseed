export type UsSession = 'DAY' | 'PRE' | 'REGULAR' | 'AFTER' | 'CLOSED';

const LABEL: Record<UsSession, string> = {
  DAY: '데이마켓',
  PRE: '프리마켓',
  REGULAR: '정규장',
  AFTER: '애프터마켓',
  CLOSED: '장 마감',
};
const SHORT_LABEL: Record<UsSession, string> = {
  DAY: '데이',
  PRE: '프리',
  REGULAR: '정규',
  AFTER: '애프터',
  CLOSED: '종가',
};

interface TimeRange {
  startTime: string;
  endTime: string;
}
interface CalendarDay {
  dayMarket?: TimeRange | null;
  preMarket?: TimeRange | null;
  regularMarket?: TimeRange | null;
  afterMarket?: TimeRange | null;
}
/** 토스 `/market-calendar/US` 응답(`result`) — 이전/오늘/다음 영업일의 세션별 시작·종료 시각 */
export interface UsMarketCalendarLike {
  today?: CalendarDay | null;
  previousBusinessDay?: CalendarDay | null;
  nextBusinessDay?: CalendarDay | null;
}

export interface UsSessionInfo {
  session: UsSession;
  label: string;
  /** 가격 표시 옆에 붙이는 짧은 이름 (프리·정규·애프터·데이·종가) */
  shortLabel: string;
  /** 현재 구간이 끝나는 시각 (CLOSED면 null) */
  endsAt: string | null;
  /** 다음에 시작하는 구간 */
  next: { session: UsSession; label: string; startsAt: string } | null;
  /** 다음 정규장 개장 시각 (지금이 정규장이면 null) */
  nextRegularOpenAt: string | null;
}

interface Segment {
  session: Exclude<UsSession, 'CLOSED'>;
  start: number;
  end: number;
}

function segmentsOf(day: CalendarDay | null | undefined): Segment[] {
  if (!day) return [];
  const pairs: Array<[Segment['session'], TimeRange | null | undefined]> = [
    ['DAY', day.dayMarket],
    ['PRE', day.preMarket],
    ['REGULAR', day.regularMarket],
    ['AFTER', day.afterMarket],
  ];
  const out: Segment[] = [];
  for (const [session, range] of pairs) {
    if (!range) continue;
    const start = Date.parse(range.startTime);
    const end = Date.parse(range.endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    out.push({ session, start, end });
  }
  return out;
}

/** 미국장 일정에서 지금이 어느 구간인지(데이·프리·정규·애프터·마감)와 다음 구간을 계산한다. 캘린더가 없으면 null */
export function getUsMarketSession(calendar: unknown, now: Date = new Date()): UsSessionInfo | null {
  if (!calendar || typeof calendar !== 'object') return null;
  const cal = calendar as UsMarketCalendarLike;
  const segments = [
    ...segmentsOf(cal.previousBusinessDay),
    ...segmentsOf(cal.today),
    ...segmentsOf(cal.nextBusinessDay),
  ].sort((a, b) => a.start - b.start);
  if (!segments.length) return null;

  const t = now.getTime();
  const current = segments.find((s) => s.start <= t && t < s.end) ?? null;
  const upcoming = segments.filter((s) => s.start > t);
  const next = upcoming[0] ?? null;
  const nextRegular = upcoming.find((s) => s.session === 'REGULAR') ?? null;
  const session: UsSession = current?.session ?? 'CLOSED';

  return {
    session,
    label: LABEL[session],
    shortLabel: SHORT_LABEL[session],
    endsAt: current ? new Date(current.end).toISOString() : null,
    next: next
      ? { session: next.session, label: LABEL[next.session], startsAt: new Date(next.start).toISOString() }
      : null,
    nextRegularOpenAt: session === 'REGULAR' || !nextRegular ? null : new Date(nextRegular.start).toISOString(),
  };
}
