/** 1억 2,345만원 / 3,200만원 / 8,500원 — 위젯 칸이 좁아 앱의 krw()보다 짧게 */
export function wonShort(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.round(Math.abs(value));
  if (abs >= 1_0000_0000) {
    const eok = Math.floor(abs / 1_0000_0000);
    const man = Math.round((abs % 1_0000_0000) / 1_0000);
    return man > 0 ? `${sign}${eok}억 ${man.toLocaleString('ko-KR')}만원` : `${sign}${eok}억원`;
  }
  if (abs >= 1_0000) return `${sign}${Math.round(abs / 1_0000).toLocaleString('ko-KR')}만원`;
  return `${sign}${abs.toLocaleString('ko-KR')}원`;
}

export function signedWon(value: number): string {
  return `${value >= 0 ? '+' : ''}${wonShort(value)}`;
}

export function usd(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function signedPct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;
}

export function hhmm(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 10만원 미만은 1원 단위까지(14,600원), 그 이상은 만원 단위 — 일별 거래처럼 작은 금액이 1만원으로 뭉개지지 않게 */
export function wonExact(value: number): string {
  const abs = Math.abs(Math.round(value));
  return abs < 100_000 ? `${abs.toLocaleString('ko-KR')}원` : wonShort(abs);
}
