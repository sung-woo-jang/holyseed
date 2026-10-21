import { LaofusPendingOrder } from '../entities/pending-order.entity';
import { LaofusTrade } from '../entities/trade.entity';
import { legOfClientOrderId, mergeSameDayBuys, toOrderLogRow } from './status.service';

describe('주문 이력 변환', () => {
  it('clientOrderId에서 leg 번호를 뽑는다', () => {
    expect(legOfClientOrderId('imu-20260930-b1')).toBe(1);
    expect(legOfClientOrderId('imu-20260930-b2')).toBe(2);
    expect(legOfClientOrderId('imu-20260930-s2')).toBe(2);
  });

  it('옛 방식·알 수 없는 형식은 null', () => {
    expect(legOfClientOrderId('imu-20260716-buy')).toBeNull();
    expect(legOfClientOrderId('')).toBeNull();
    expect(legOfClientOrderId(null)).toBeNull();
  });

  it('보류 주문 행을 숫자·UTC 시각으로 바꾼다', () => {
    const row = toOrderLogRow({
      id: 77,
      orderId: 'secret-order-id',
      clientOrderId: 'imu-20261001-b1',
      side: 'BUY',
      kind: '절반',
      tBefore: '4.0000',
      tAfter: '4.5000',
      requestAmount: '163.75',
      requestQuantity: null,
      cycleId: 2,
      status: 'APPLIED',
      appliedTradeId: 77,
      placedAt: new Date('2026-10-01T00:00:01.798Z'),
    } as unknown as LaofusPendingOrder);

    expect(row).toEqual({
      id: 77,
      cycleId: 2,
      side: 'BUY',
      kind: '절반',
      leg: 1,
      tBefore: 4,
      tAfter: 4.5,
      requestAmount: 163.75,
      requestQuantity: null,
      status: 'APPLIED',
      appliedTradeId: 77,
      placedAt: '2026-10-01T00:00:01Z',
    });
    expect(JSON.stringify(row)).not.toContain('secret-order-id');
  });
});

describe('같은 날 매수 병합', () => {
  const mk = (id: number, seq: number, o: Partial<LaofusTrade>): LaofusTrade =>
    ({
      id,
      seq,
      date: '2026-10-21',
      kind: '전액',
      side: 'BUY',
      price: '97.5500',
      quantity: '1',
      amount: '97.55',
      tBefore: '12.8750',
      tAfter: '13.8750',
      avgAfter: '100',
      qtyAfter: '10',
      cashAfter: '1000',
      ...o,
    }) as LaofusTrade;

  it('전액 3주 + 분할 1주를 4주·T+1 한 줄로 합친다', () => {
    const out = mergeSameDayBuys([
      mk(98, 29, { quantity: '3', amount: '292.65' }),
      mk(99, 30, { kind: '분할', tBefore: '13.8750', tAfter: '13.8750' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      seq: 1,
      kind: '전액',
      quantity: '4',
      amount: '390.2',
      price: '97.55',
      tBefore: '12.8750',
      tAfter: '13.8750',
    });
  });

  it('절반+절반은 전액 1건으로 합친다', () => {
    const out = mergeSameDayBuys([
      mk(1, 1, { kind: '절반', tBefore: '9.3750', tAfter: '9.8750' }),
      mk(2, 2, { kind: '절반', tBefore: '9.8750', tAfter: '10.3750' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: '전액', quantity: '2', tBefore: '9.3750', tAfter: '10.3750' });
  });

  it('절반 하나만 체결되면 절반 그대로 둔다', () => {
    const out = mergeSameDayBuys([mk(1, 1, { kind: '절반', tBefore: '9.3750', tAfter: '9.8750' })]);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('절반');
  });

  it('분할 가격이 달라도 가중평균 체결가로 합친다', () => {
    const out = mergeSameDayBuys([
      mk(1, 1, { quantity: '3', price: '100', amount: '300' }),
      mk(2, 2, { kind: '분할', price: '90', amount: '90', tBefore: '13.8750', tAfter: '13.8750' }),
      mk(3, 3, { kind: '분할', price: '90', amount: '90', tBefore: '13.8750', tAfter: '13.8750' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ quantity: '5', amount: '480', price: '96' });
  });

  it('날짜가 다르거나 매도가 끼면 합치지 않고 차수를 다시 매긴다', () => {
    const out = mergeSameDayBuys([
      mk(1, 1, { date: '2026-10-20', tBefore: '11.8750', tAfter: '12.8750' }),
      mk(2, 2, {}),
      mk(3, 3, { side: 'SELL', kind: '쿼터', tBefore: '13.8750', tAfter: '13.1250' }),
      mk(4, 4, { kind: '분할', tBefore: '13.1250', tAfter: '13.1250' }),
    ]);
    expect(out.map((t) => [t.seq, t.id])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ]);
  });
});
