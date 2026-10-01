const KST_DATE = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });

/** 서버 타임존과 무관하게 한국 날짜 YYYY-MM-DD */
export const todayKst = (): string => KST_DATE.format(new Date());

export const addDays = (isoDate: string, n: number): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
