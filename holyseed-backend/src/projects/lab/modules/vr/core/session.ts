/**
 * 미국 시장의 현재 활성 세션(PRE/REGULAR/AFTER) 판별 — 순수함수.
 * packages/vr-core/src/session.ts와 동일 로직의 백엔드 사본.
 *
 * laofus의 checkWindow()와 달리 VR은 "마감까지 몇 분"이 아니라 "지금 어떤 세션이 열려있는가"만
 * 필요하다. previousBusinessDay/today/nextBusinessDay 3영업일을 전부 검사한다(자정 근처 KST
 * 날짜 경계 문제 회피 — laofus checkWindow와 동일한 이유).
 */

export interface MarketSessionTime {
  startTime: string; // KST ISO 8601
  endTime: string;
}

export interface UsMarketDay {
  date: string;
  dayMarket: MarketSessionTime | null;
  preMarket: MarketSessionTime | null;
  regularMarket: MarketSessionTime | null;
  afterMarket: MarketSessionTime | null;
}

export interface UsMarketCalendar {
  today: UsMarketDay;
  previousBusinessDay: UsMarketDay;
  nextBusinessDay: UsMarketDay;
}

export type MarketSession = 'PRE' | 'REGULAR' | 'AFTER' | null;

export function activeSession(cal: UsMarketCalendar, now: Date = new Date()): MarketSession {
  const days: UsMarketDay[] = [cal.previousBusinessDay, cal.today, cal.nextBusinessDay];
  const t = now.getTime();

  for (const day of days) {
    if (!day) continue;
    const checks: [MarketSession, MarketSessionTime | null][] = [
      ['PRE', day.preMarket],
      ['REGULAR', day.regularMarket],
      ['AFTER', day.afterMarket],
    ];
    for (const [session, window] of checks) {
      if (!window) continue;
      const start = new Date(window.startTime).getTime();
      const end = new Date(window.endTime).getTime();
      if (t >= start && t <= end) return session;
    }
  }
  return null;
}
