import { LaofusPendingOrder } from '../entities/pending-order.entity';
import { legOfClientOrderId, toOrderLogRow } from './status.service';

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
