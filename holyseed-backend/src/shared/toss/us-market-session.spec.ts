import { getUsMarketSession } from './us-market-session';

// 2026-10-01 실제 토스 /market-calendar/US 응답 (한국시간)
function day(date: string, nextDate: string) {
  return {
    date,
    dayMarket: { startTime: `${date}T09:00:00.000+09:00`, endTime: `${date}T17:00:00.000+09:00` },
    preMarket: { startTime: `${date}T17:00:00.000+09:00`, endTime: `${date}T22:30:00.000+09:00` },
    regularMarket: { startTime: `${date}T22:30:00.000+09:00`, endTime: `${nextDate}T05:00:00.000+09:00` },
    afterMarket: { startTime: `${nextDate}T05:00:00.000+09:00`, endTime: `${nextDate}T08:50:00.000+09:00` },
  };
}
const CALENDAR = {
  previousBusinessDay: day('2026-09-30', '2026-10-01'),
  today: day('2026-10-01', '2026-10-02'),
  nextBusinessDay: day('2026-10-02', '2026-10-03'),
};

const at = (iso: string) => new Date(iso);

describe('getUsMarketSession', () => {
  it('20:46 KST는 프리마켓이고, 22:30 정규장 개장이 다음 정규장이다', () => {
    const s = getUsMarketSession(CALENDAR, at('2026-10-01T20:46:00+09:00'));

    expect(s?.session).toBe('PRE');
    expect(s?.label).toBe('프리마켓');
    expect(s?.shortLabel).toBe('프리');
    expect(s?.endsAt).toBe(at('2026-10-01T22:30:00+09:00').toISOString());
    expect(s?.next).toEqual({
      session: 'REGULAR',
      label: '정규장',
      startsAt: at('2026-10-01T22:30:00+09:00').toISOString(),
    });
    expect(s?.nextRegularOpenAt).toBe(at('2026-10-01T22:30:00+09:00').toISOString());
  });

  it('23:00 KST는 정규장이고 다음 정규장 개장 시각은 없다', () => {
    const s = getUsMarketSession(CALENDAR, at('2026-10-01T23:00:00+09:00'));

    expect(s?.session).toBe('REGULAR');
    expect(s?.endsAt).toBe(at('2026-10-02T05:00:00+09:00').toISOString());
    expect(s?.next?.session).toBe('AFTER');
    expect(s?.nextRegularOpenAt).toBeNull();
  });

  it('자정을 넘긴 새벽 03:00 KST도 전날 정규장이다 (이전 영업일 일정 사용)', () => {
    const s = getUsMarketSession(CALENDAR, at('2026-10-01T03:00:00+09:00'));

    expect(s?.session).toBe('REGULAR');
  });

  it('05:30 KST는 애프터마켓, 08:55 KST는 장 마감, 10:00 KST는 데이마켓이다', () => {
    expect(getUsMarketSession(CALENDAR, at('2026-10-02T05:30:00+09:00'))?.session).toBe('AFTER');

    const closed = getUsMarketSession(CALENDAR, at('2026-10-02T08:55:00+09:00'));
    expect(closed?.session).toBe('CLOSED');
    expect(closed?.shortLabel).toBe('종가');
    expect(closed?.endsAt).toBeNull();
    expect(closed?.next?.session).toBe('DAY');

    expect(getUsMarketSession(CALENDAR, at('2026-10-02T10:00:00+09:00'))?.session).toBe('DAY');
  });

  it('구간 경계 시각(22:30:00)은 새 구간으로 본다', () => {
    expect(getUsMarketSession(CALENDAR, at('2026-10-01T22:30:00+09:00'))?.session).toBe('REGULAR');
  });

  it('일정이 없거나 형식이 다르면 null', () => {
    expect(getUsMarketSession(null)).toBeNull();
    expect(getUsMarketSession({})).toBeNull();
    expect(getUsMarketSession('x')).toBeNull();
  });
});
