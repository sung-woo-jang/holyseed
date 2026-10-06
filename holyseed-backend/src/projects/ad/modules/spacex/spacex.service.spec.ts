import { Repository } from 'typeorm';
import { TossClientService, TossOrder } from '@shared/toss/toss-client.service';
import { TossPriceHubService } from '@shared/toss/toss-price-hub.service';
import { SpacexEntry, SpacexState } from './entities';
import { SpacexService } from './spacex.service';

function candle(date: string, open: number, high: number, low: number, close: number) {
  return {
    timestamp: `${date}T13:00:00.000+09:00`,
    openPrice: String(open),
    highPrice: String(high),
    lowPrice: String(low),
    closePrice: String(close),
    volume: '1000',
  };
}

function order(
  orderId: string,
  status: string,
  orderedAt: string,
  extra: Partial<TossOrder> & { filled?: { qty: string; amount: string; avg: string; at: string } } = {},
): TossOrder {
  const { filled, ...rest } = extra;
  return {
    orderId,
    symbol: 'SPCX',
    side: 'BUY',
    orderType: 'MARKET',
    status,
    quantity: '0.013209',
    price: null,
    orderAmount: '2',
    orderedAt,
    execution: filled
      ? {
          filledQuantity: filled.qty,
          averageFilledPrice: filled.avg,
          filledAmount: filled.amount,
          commission: '0',
          filledAt: filled.at,
        }
      : { filledQuantity: '0', averageFilledPrice: null, filledAmount: null, commission: null, filledAt: null },
    ...rest,
  };
}

describe('SpacexService', () => {
  let toss: { getCandles: jest.Mock; getOrders: jest.Mock };
  let hub: { getPrice: jest.Mock };
  let entryRepo: { find: jest.Mock; count: jest.Mock; save: jest.Mock };
  let stateRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let service: SpacexService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-01T22:40:00+09:00'));
    toss = {
      getCandles: jest.fn().mockResolvedValue({
        candles: [
          candle('2026-10-01', 150.45, 152.07, 150.24, 151.63),
          candle('2026-09-30', 149, 151, 148.5, 150.86),
          candle('2026-09-12', 152, 153, 150, 151),
          candle('2026-06-16', 190, 225.64, 180, 200),
          candle('2026-06-12', 150, 176.52, 149.34, 160.95),
          candle('2026-08-03', 110, 112, 104.83, 108),
        ],
        nextBefore: null,
      }),
      getOrders: jest.fn().mockResolvedValue({ orders: [], nextCursor: null, hasNext: false }),
    };
    hub = {
      getPrice: jest
        .fn()
        .mockResolvedValue({ symbol: 'SPCX', price: 152.25, ts: 'x', fetchedAt: Date.now(), stale: false }),
    };
    entryRepo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn().mockImplementation(async (x: unknown) => x),
    };
    stateRepo = { find: jest.fn().mockResolvedValue([{ closedAt: null }]), create: jest.fn(), save: jest.fn() };
    service = new SpacexService(
      entryRepo as unknown as Repository<SpacexEntry>,
      stateRepo as unknown as Repository<SpacexState>,
      toss as unknown as TossClientService,
      hub as unknown as TossPriceHubService,
    );
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCandles', () => {
    it('일봉을 날짜 오름차순으로 돌려주고 상장가·고점·저점을 전체 일봉에서 계산한다', async () => {
      const res = await service.getCandles('all');

      expect(res.candles.map((c) => c.date)).toEqual([
        '2026-06-12',
        '2026-06-16',
        '2026-08-03',
        '2026-09-12',
        '2026-09-30',
        '2026-10-01',
      ]);
      expect(res.candles[0]).toEqual({ date: '2026-06-12', open: 150, high: 176.52, low: 149.34, close: 160.95 });
      expect(res.listing).toEqual({
        date: '2026-06-12',
        openPrice: 150,
        high: { price: 225.64, date: '2026-06-16' },
        low: { price: 104.83, date: '2026-08-03' },
      });
    });

    it('1m은 최근 30일, 2w는 최근 14일만 돌려주되 listing은 전체 기준이다', async () => {
      const month = await service.getCandles('1m');
      expect(month.range).toBe('1m');
      expect(month.candles.map((c) => c.date)).toEqual(['2026-09-12', '2026-09-30', '2026-10-01']);

      const twoWeeks = await service.getCandles('2w');
      expect(twoWeeks.candles.map((c) => c.date)).toEqual(['2026-09-30', '2026-10-01']);
      expect(twoWeeks.listing?.high.price).toBe(225.64);
    });

    it('알 수 없는 range는 all로 취급한다', async () => {
      expect((await service.getCandles('weird')).range).toBe('all');
    });

    it('일봉은 5분간 캐시하고, nextBefore가 있으면 이어서 받는다', async () => {
      toss.getCandles
        .mockResolvedValueOnce({
          candles: [candle('2026-10-01', 1, 2, 0.5, 1.5)],
          nextBefore: '2026-10-01T00:00:00+09:00',
        })
        .mockResolvedValueOnce({ candles: [candle('2026-09-30', 1, 2, 0.5, 1.2)], nextBefore: null });

      const res = await service.getCandles('all');

      expect(res.candles.map((c) => c.date)).toEqual(['2026-09-30', '2026-10-01']);
      expect(toss.getCandles).toHaveBeenCalledTimes(2);
      expect(toss.getCandles).toHaveBeenLastCalledWith('SPCX', '1d', 200, '2026-10-01T00:00:00+09:00');

      await service.getCandles('2w');
      expect(toss.getCandles).toHaveBeenCalledTimes(2);

      jest.setSystemTime(new Date('2026-10-01T22:46:00+09:00'));
      toss.getCandles.mockResolvedValue({ candles: [candle('2026-10-01', 1, 2, 0.5, 1.5)], nextBefore: null });
      await service.getCandles('all');
      expect(toss.getCandles).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStatus().latestOrder', () => {
    it('접수만 된 금액 주문은 PENDING과 주문 금액·추정 수량을 돌려준다', async () => {
      toss.getOrders.mockImplementation((status: string) =>
        Promise.resolve({
          orders: status === 'OPEN' ? [order('o-today', 'PENDING', '2026-10-01T21:24:21.390+09:00')] : [],
          nextCursor: null,
          hasNext: false,
        }),
      );

      const { latestOrder } = await service.getStatus();

      expect(latestOrder).toEqual({
        orderId: 'o-today',
        status: 'PENDING',
        amount: 2,
        quantity: 0.013209,
        avgPrice: null,
        orderedAt: '2026-10-01T21:24:21.390+09:00',
        filledAt: null,
        recorded: false,
      });
    });

    it('체결된 주문은 체결 금액·수량·평균가를 주고, 기록 동기화 여부를 recorded로 알린다', async () => {
      toss.getOrders.mockImplementation((status: string) =>
        Promise.resolve({
          orders:
            status === 'CLOSED'
              ? [
                  order('o-yday', 'FILLED', '2026-09-30T21:32:25.181+09:00', {
                    filled: {
                      qty: '0.013285',
                      amount: '1.999858',
                      avg: '150.535039',
                      at: '2026-09-30T23:05:30.358+09:00',
                    },
                  }),
                ]
              : [],
          nextCursor: null,
          hasNext: false,
        }),
      );

      const notYet = (await service.getStatus()).latestOrder;
      expect(notYet).toMatchObject({
        status: 'FILLED',
        amount: 1.999858,
        quantity: 0.013285,
        avgPrice: 150.535039,
        recorded: false,
      });

      entryRepo.count.mockResolvedValue(1);
      jest.setSystemTime(new Date('2026-10-01T22:41:00+09:00'));
      jest.advanceTimersByTime(60_000);
      jest.setSystemTime(new Date('2026-10-01T22:50:00+09:00'));
      expect((await service.getStatus()).latestOrder?.recorded).toBe(true);
    });

    it('미체결과 종료 주문이 섞여 있으면 가장 최근에 접수한 주문을 고른다', async () => {
      toss.getOrders.mockImplementation((status: string) =>
        Promise.resolve({
          orders:
            status === 'OPEN'
              ? [order('o-new', 'PENDING', '2026-10-01T21:24:21.390+09:00')]
              : [
                  order('o-old', 'FILLED', '2026-09-30T21:32:25.181+09:00', {
                    filled: {
                      qty: '0.013285',
                      amount: '1.999858',
                      avg: '150.535039',
                      at: '2026-09-30T23:05:30.358+09:00',
                    },
                  }),
                ],
          nextCursor: null,
          hasNext: false,
        }),
      );

      expect((await service.getStatus()).latestOrder?.orderId).toBe('o-new');
    });

    it('취소·거부된 주문은 CANCELED로, 매도 주문은 무시한다', async () => {
      toss.getOrders.mockImplementation((status: string) =>
        Promise.resolve({
          orders:
            status === 'CLOSED'
              ? [
                  { ...order('o-sell', 'FILLED', '2026-10-01T22:00:00.000+09:00'), side: 'SELL' as const },
                  order('o-cancel', 'CANCELED', '2026-10-01T21:24:21.390+09:00'),
                ]
              : [],
          nextCursor: null,
          hasNext: false,
        }),
      );

      expect((await service.getStatus()).latestOrder).toMatchObject({ orderId: 'o-cancel', status: 'CANCELED' });
    });

    it('주문이 없으면 null, 주문 조회가 실패해도 상태 전체는 정상 반환한다', async () => {
      expect((await service.getStatus()).latestOrder).toBeNull();

      toss.getOrders.mockRejectedValue(new Error('429'));
      jest.setSystemTime(new Date('2026-10-01T22:50:00+09:00'));
      const status = await service.getStatus();

      expect(status.latestOrder).toBeNull();
      expect(status.currentPrice).toBe(152.25);
    });

    it('주문 목록은 30초간 다시 조회하지 않는다', async () => {
      await service.getStatus();
      await service.getStatus();

      expect(toss.getOrders).toHaveBeenCalledTimes(2); // OPEN + CLOSED 한 번씩
    });
  });

  describe('기록의 일봉(시가·고가·저가·종가) 채우기', () => {
    const blank = { dayOpen: null, dayHigh: null, dayLow: null, dayClose: null };

    it('완결된 지난 날의 기록에 그날 일봉을 채워 저장한다', async () => {
      const past = {
        id: 1,
        date: '2026-09-30',
        amount: 2,
        price: 150,
        quantity: 0.01,
        isRebalance: false,
        note: null,
        orderId: null,
        ...blank,
      };
      entryRepo.find.mockResolvedValue([past]);
      await service.getStatus();
      expect(entryRepo.save).toHaveBeenCalledTimes(1);
      expect(past).toMatchObject({ dayOpen: 149, dayHigh: 151, dayLow: 148.5, dayClose: 150.86 });
    });

    it('오늘 기록은 일봉이 아직 진행 중이라 채우지 않는다', async () => {
      const today = {
        id: 2,
        date: '2026-10-01',
        amount: 2,
        price: 151,
        quantity: 0.01,
        isRebalance: false,
        note: null,
        orderId: null,
        ...blank,
      };
      entryRepo.find.mockResolvedValue([today]);
      await service.getStatus();
      expect(entryRepo.save).not.toHaveBeenCalled();
      expect(today.dayClose).toBeNull();
    });

    it('이미 채워진 기록은 일봉을 다시 받지 않고, 해당 날짜 일봉이 없으면 비워 둔다', async () => {
      const filled = {
        id: 3,
        date: '2026-09-30',
        amount: 2,
        price: 150,
        quantity: 0.01,
        isRebalance: false,
        note: null,
        orderId: null,
        dayOpen: 1,
        dayHigh: 2,
        dayLow: 0.5,
        dayClose: 1.5,
      };
      const noCandle = {
        id: 4,
        date: '2026-09-29',
        amount: 2,
        price: 150,
        quantity: 0.01,
        isRebalance: false,
        note: null,
        orderId: null,
        ...blank,
      };
      entryRepo.find.mockResolvedValue([filled, noCandle]);
      await service.getStatus();
      expect(entryRepo.save).not.toHaveBeenCalled();
      expect(filled.dayClose).toBe(1.5);
      expect(noCandle.dayClose).toBeNull();
    });

    it('일봉 조회가 실패해도 상태 조회는 정상 반환한다', async () => {
      toss.getCandles.mockRejectedValue(new Error('toss down'));
      entryRepo.find.mockResolvedValue([
        {
          id: 5,
          date: '2026-09-30',
          amount: 2,
          price: 150,
          quantity: 0.01,
          isRebalance: false,
          note: null,
          orderId: null,
          ...blank,
        },
      ]);
      await expect(service.getStatus()).resolves.toMatchObject({ daysCount: 1 });
    });
  });
});
