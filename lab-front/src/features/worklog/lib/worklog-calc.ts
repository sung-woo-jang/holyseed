/**
 * 급여 계산 (백엔드 WorklogService.calcAmount와 동일 공식 — 미리보기용 의도적 중복)
 * 시급 = 일급여 ÷ 임계시간, 실근무 = 총근무 − 휴게, 초과 = max(0, 실근무 − 임계시간)
 * 공수 = 1 + 초과/임계시간, 금액 = 공수×일급여 + 초과×시급×가산율
 */
export function calcWorklogAmount(params: {
  startTime?: string
  endTime?: string
  breakHours: number
  dailyWage: number
  isDayoff?: boolean
  overtimeThresholdHours?: number
  overtimeExtraRate?: number
}): number {
  const {
    startTime,
    endTime,
    breakHours,
    dailyWage,
    isDayoff,
    overtimeThresholdHours = 8,
    overtimeExtraRate = 0.1,
  } = params
  if (isDayoff) return 0
  if (!startTime || !endTime) return dailyWage

  const toHours = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return NaN
    return h + m / 60
  }
  let total = toHours(endTime) - toHours(startTime)
  if (isNaN(total)) return dailyWage
  if (total < 0) total += 24
  const worked = Math.max(0, total - breakHours)
  const overtime = Math.max(0, worked - overtimeThresholdHours)
  return Math.round(
    (1 + overtime / overtimeThresholdHours) * dailyWage +
      overtime * (dailyWage / overtimeThresholdHours) * overtimeExtraRate
  )
}

/** 일당 기준 (백엔드와 동일 이력) */
export function getDailyWage(date: string): number {
  return date >= '2026-06-17' ? 140000 : 130000
}

export const WITHHOLDING_RATE = 0.033
