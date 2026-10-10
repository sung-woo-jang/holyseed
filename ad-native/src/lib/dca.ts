/**
 * 모으기 탭의 종목 — 상단 알약 탭과 화면 라우트가 정해져 있어야 해서 앱에 고정해 둔다.
 * 종목을 늘리려면 서버 계획(DEFAULT_PLANS 또는 POST /ad/spacex/plans)과 여기·RecordsStack에 함께 추가.
 */
export const DCA_SYMBOLS = [
  { symbol: 'SPCX', label: '스페이스X', route: 'SpacexOverview', color: '#3182F6' },
  { symbol: 'UPRO', label: 'UPRO', route: 'UproOverview', color: '#0AB39C' },
] as const;

export type DcaRoute = (typeof DCA_SYMBOLS)[number]['route'];

const FALLBACK_COLOR = '#8B95A1';

export function dcaColor(symbol: string): string {
  return DCA_SYMBOLS.find((d) => d.symbol === symbol)?.color ?? FALLBACK_COLOR;
}

export function dcaLabel(symbol: string): string {
  return DCA_SYMBOLS.find((d) => d.symbol === symbol)?.label ?? symbol;
}

export function dcaRoute(symbol: string): DcaRoute | null {
  return DCA_SYMBOLS.find((d) => d.symbol === symbol)?.route ?? null;
}
