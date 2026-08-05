/** SVG 차트 끝점 라벨이 플롯 영역 밖으로 잘리지 않도록 y좌표를 경계 안으로 고정 */
export function clampLabelY(y: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, y))
}

/** 두 라벨의 y좌표가 minGap보다 가까우면 중간점 기준으로 서로 밀어내 겹침을 방지 */
export function resolveLabelPair(y1: number, y2: number, minGap: number): [number, number] {
  const gap = y2 - y1
  if (Math.abs(gap) >= minGap) return [y1, y2]
  const mid = (y1 + y2) / 2
  const half = minGap / 2
  return gap >= 0 ? [mid - half, mid + half] : [mid + half, mid - half]
}
