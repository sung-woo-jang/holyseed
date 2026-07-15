/**
 * 미국 정규장 마감시각 확인 및 "마감 30분 전 창" 판단 — 순수함수 (API 클라이언트 비의존).
 *
 * 주의: 토스 market-calendar API의 `today`는 KST 날짜 기준이다 — KST 새벽(예: 04:30)에는
 * 진행 중인 세션(그날 05:00 마감)이 `previousBusinessDay`에 들어있다.
 * 따라서 previous/today/next 세 날짜의 세션을 모두 검사한다.
 * (2026-07-15 새벽 실제 미체결 사고의 원인 — today만 봐서 창을 놓침)
 */

export interface MarketSessionTime {
  startTime: string // KST ISO 8601
  endTime: string
}

export interface UsMarketDay {
  date: string
  dayMarket: MarketSessionTime | null
  preMarket: MarketSessionTime | null
  regularMarket: MarketSessionTime | null // 휴장 시 null
  afterMarket: MarketSessionTime | null
}

export interface UsMarketCalendar {
  today: UsMarketDay
  previousBusinessDay: UsMarketDay
  nextBusinessDay: UsMarketDay
}

export interface MarketWindow {
  ok: boolean
  reason: string
  usDate?: string
  closeAt?: Date
}

/** now가 어떤 거래일이든 정규장 마감 전 [35분, 20분] 창 안인지 확인 */
export function checkWindow(cal: UsMarketCalendar, now: Date = new Date()): MarketWindow {
  const days: UsMarketDay[] = [cal.previousBusinessDay, cal.today, cal.nextBusinessDay]

  let nearest: { day: UsMarketDay; closeAt: Date; minutes: number } | null = null
  for (const day of days) {
    if (!day?.regularMarket) continue
    const closeAt = new Date(day.regularMarket.endTime)
    const minutes = (closeAt.getTime() - now.getTime()) / 60000
    if (minutes >= 20 && minutes <= 35) {
      return { ok: true, reason: `마감 ${minutes.toFixed(1)}분 전 — 실행 창`, usDate: day.date, closeAt }
    }
    if (minutes > 0 && (!nearest || minutes < nearest.minutes)) {
      nearest = { day, closeAt, minutes }
    }
  }

  if (!nearest) {
    return { ok: false, reason: `가까운 정규장 세션 없음 (휴장?)` }
  }
  return {
    ok: false,
    reason: `마감까지 ${nearest.minutes.toFixed(1)}분 — 창(20~35분 전) 아님`,
    usDate: nearest.day.date,
    closeAt: nearest.closeAt,
  }
}
