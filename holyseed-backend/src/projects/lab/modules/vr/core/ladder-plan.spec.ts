import { planLadder, missingRungs, marketableQty } from './ladder-plan';
import { tradingWindowOpen, UsMarketCalendar } from './session';

// 2026-09-30 실제 사이클 8 값
const base = {
  quantity: 57,
  minBand: 4171.21,
  maxBand: 5643.4,
  pool: 2623.32,
  cyclePoolStart: 2623.32,
  poolLimitPct: 75,
};

describe('planLadder', () => {
  it('실제 사이클 8 값으로 매수/매도 3단계 가격이 수동으로 건 주문과 같다', () => {
    const { buys, sells } = planLadder({ ...base, steps: 3 });
    expect(buys.map((r) => r.price)).toEqual([73.18, 71.92, 70.7]);
    expect(sells.map((r) => r.price)).toEqual([99.01, 100.78, 102.61]);
    expect(buys.map((r) => r.prevQty)).toEqual([57, 58, 59]);
    expect(sells.map((r) => r.prevQty)).toEqual([57, 56, 55]);
  });

  it('Pool 사용한도를 넘는 매수 단계는 걸지 않는다', () => {
    const { buys } = planLadder({ ...base, pool: 655.83 + 100, steps: 3 }); // 쓸 수 있는 돈 $100
    expect(buys.map((r) => r.price)).toEqual([73.18]);
  });

  it('보유수량보다 많은 매도 단계는 만들지 않는다', () => {
    const { sells } = planLadder({ ...base, quantity: 2, steps: 3 });
    expect(sells).toHaveLength(2);
  });

  it('체결 후 상태가 바뀌면 남은 단계 가격은 그대로고 새 단계만 추가된다', () => {
    const before = planLadder({ ...base, steps: 3 }).buys;
    const after = planLadder({ ...base, quantity: 58, pool: 2550.14, steps: 3 }).buys;
    expect(after.slice(0, 2)).toEqual(before.slice(1, 3));
    expect(after).toHaveLength(3);
  });
});

describe('missingRungs', () => {
  const planned = planLadder({ ...base, steps: 3 });
  it('이미 걸린 같은 가격 주문은 빼고 없는 단계만 돌려준다', () => {
    const open = [
      { side: 'BUY' as const, price: 73.18, quantity: 1 },
      { side: 'SELL' as const, price: 99.01, quantity: 1 },
    ];
    expect(missingRungs(planned.buys, open).map((r) => r.price)).toEqual([71.92, 70.7]);
    expect(missingRungs(planned.sells, open).map((r) => r.price)).toEqual([100.78, 102.61]);
  });
  it('같은 가격이라도 방향이 다르면 별개다', () => {
    expect(missingRungs(planned.buys, [{ side: 'SELL', price: 73.18, quantity: 1 }])).toHaveLength(3);
  });
});

describe('marketableQty', () => {
  const open = [
    { side: 'BUY' as const, price: 73.18, quantity: 1 },
    { side: 'BUY' as const, price: 71.92, quantity: 1 },
    { side: 'SELL' as const, price: 99.01, quantity: 1 },
  ];
  it('현재가에서 바로 체결될 주문 수량만 센다', () => {
    expect(marketableQty(open, 'BUY', 72.5)).toBe(1); // 73.18만 체결 가능
    expect(marketableQty(open, 'BUY', 77)).toBe(0);
    expect(marketableQty(open, 'SELL', 100)).toBe(1);
  });
});

describe('tradingWindowOpen', () => {
  const day = (date: string, next: string) => ({
    date,
    dayMarket: { startTime: `${date}T09:00:00.000+09:00`, endTime: `${date}T17:00:00.000+09:00` },
    preMarket: { startTime: `${date}T17:00:00.000+09:00`, endTime: `${date}T22:30:00.000+09:00` },
    regularMarket: { startTime: `${date}T22:30:00.000+09:00`, endTime: `${next}T05:00:00.000+09:00` },
    afterMarket: { startTime: `${next}T05:00:00.000+09:00`, endTime: `${next}T08:50:00.000+09:00` },
  });
  const cal: UsMarketCalendar = {
    previousBusinessDay: day('2026-09-29', '2026-09-30'),
    today: day('2026-09-30', '2026-10-01'),
    nextBusinessDay: day('2026-10-01', '2026-10-02'),
  };
  it('09:00 이후~다음날 08:50까지 열림, 08:50~09:00 사이는 닫힘', () => {
    expect(tradingWindowOpen(cal, new Date('2026-09-30T09:00:30+09:00'))).toBe(true);
    expect(tradingWindowOpen(cal, new Date('2026-10-01T03:00:00+09:00'))).toBe(true);
    expect(tradingWindowOpen(cal, new Date('2026-09-30T08:55:00+09:00'))).toBe(false);
  });
});
