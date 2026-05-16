export function krw(value: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
}

export function krwShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_0000_0000) return `${sign}${(abs / 1_0000_0000).toFixed(1)}억`;
  if (abs >= 1_0000) return `${sign}${(abs / 1_0000).toFixed(0)}만`;
  return krw(value);
}

export function pct(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function dateStr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function monthStr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const ASSET_CATEGORY_LABEL: Record<string, string> = {
  CASH: '현금성',
  INVESTMENT: '투자',
  CRYPTO: '가상자산',
  REAL_ESTATE: '실물자산',
  PENSION: '연금·보험',
  LIABILITY: '부채',
};

export const TX_TYPE_LABEL: Record<string, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
  TRANSFER: '이체',
};

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function monthDayWeek(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = DAY_KO[d.getDay()];
  return `${m}월 ${day}일 · ${wd}`;
}

export function ymStr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
