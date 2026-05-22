/** USD 포맷: $1,234.56 */
export function fmtUSD(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v)) return '-'
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

/** 숫자 포맷: 1,234.56 */
export function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v)) return '-'
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** 퍼센트 포맷: +12.34% */
export function fmtPct(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v)) return '-'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(decimals)}%`
}

/** T값 포맷: 소수점 최대 4자리 */
export function fmtT(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '-'
  return v.toFixed(4).replace(/\.?0+$/, '')
}

/** 날짜 포맷: 2025. 05. 22 */
export function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return '-'
  const d = typeof v === 'string' ? new Date(v) : v
  return d.toLocaleDateString('ko-KR')
}

/** 모드 라벨 */
export const MODE_LABEL: Record<string, string> = {
  cycle_start: '사이클시작',
  first_half: '전반전',
  second_half: '후반전',
  reverse: '리버스',
}

export const MODE_FULL: Record<string, string> = {
  cycle_start: '사이클 시작',
  first_half: '일반 · 전반전',
  second_half: '일반 · 후반전',
  reverse: '리버스 모드',
}

export const MODE_COLOR: Record<string, string> = {
  cycle_start: 'var(--color-mode-start)',
  first_half: 'var(--color-mode-first)',
  second_half: 'var(--color-mode-second)',
  reverse: 'var(--color-mode-reverse)',
}
