import { TossClientService, TossHoldingItem, TossOrder } from '@shared/toss/toss-client.service';
import { HubPrice, TossPriceHubService } from '@shared/toss/toss-price-hub.service';
import { LaofusStatusService } from './status.service';
import { LaofusLiveService } from './live.service';

const TS = '2026-10-01T20:46:40.000+09:00';

function holding(
  symbol: string,
  quantity: string,
  avg: string,
  lastPrice: string,
  purchase: string,
  dailyRate: string,
): TossHoldingItem {
  return {
    symbol,
    name: symbol,
    quantity,
    averagePurchasePrice: avg,
    lastPrice,
    marketValue: { amount: String(Number(quantity) * Number(lastPrice)), purchaseAmount: purchase },
    profitLoss: { amount: '0', rate: '0' },
    dailyProfitLoss: { amount: '0', rate: dailyRate },
  };
}

const HOLDINGS = [
  holding('SPCX', '0.10661', '150.075302', '151.49', '15.999528', '0.0041'),
  holding('SOXL', '8', '146.215', '151.2', '1169.72', '0.0228'),
  holding('TQQQ', '57', '71.831196', '79.53', '4094.378172', '0.0208'),
];

function order(symbol: string, side: 'BUY' | 'SELL', tif: 'DAY' | 'CLS', quantity: string, price: string): TossOrder {
  return {
    orderId: `${symbol}-${side}-${price}`,
    symbol,
    side,
    orderType: 'LIMIT',
    timeInForce: tif,
    status: 'PENDING',
    quantity,
    price,
    orderAmount: null,
    orderedAt: '2026-10-01T09:00:00.000+09:00',
    execution: { filledQuantity: '0', averageFilledPrice: null, filledAmount: null, commission: null, filledAt: null },
  };
}

const OPEN_ORDERS = [
  order('TQQQ', 'SELL', 'DAY', '1', '102.61'),
  order('TQQQ', 'SELL', 'DAY', '1', '99.01'),
  order('TQQQ', 'BUY', 'DAY', '1', '70.7'),
  order('TQQQ', 'BUY', 'DAY', '1', '73.18'),
  order('SOXL', 'SELL', 'DAY', '6', '175.46'),
  order('SOXL', 'SELL', 'CLS', '2', '163.76'),
  order('SOXL', 'BUY', 'CLS', '1', '146.21'),
  order('SOXL', 'BUY', 'CLS', '1', '163.75'),
];

const CALENDAR = {
  today: {
    dayMarket: { startTime: '2026-10-01T09:00:00.000+09:00', endTime: '2026-10-01T17:00:00.000+09:00' },
    preMarket: { startTime: '2026-10-01T17:00:00.000+09:00', endTime: '2026-10-01T22:30:00.000+09:00' },
    regularMarket: { startTime: '2026-10-01T22:30:00.000+09:00', endTime: '2026-10-02T05:00:00.000+09:00' },
    afterMarket: { startTime: '2026-10-02T05:00:00.000+09:00', endTime: '2026-10-02T08:50:00.000+09:00' },
  },
};

function hubPrice(symbol: string, price: number, stale = false): HubPrice {
  return { symbol, price, ts: TS, fetchedAt: Date.now(), stale };
}

describe('LaofusLiveService', () => {
  const prices: Record<string, number> = { TQQQ: 79.53, SOXL: 151.2, SPCX: 151.49 };
  let toss: { getHoldingsAll: jest.Mock; getExchangeRate: jest.Mock; getOrders: jest.Mock; getBuyingPower: jest.Mock };
  let hub: { getPrice: jest.Mock };
  let status: { getCalendar: jest.Mock };
  let service: LaofusLiveService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-01T20:46:50+09:00'));
    toss = {
      getHoldingsAll: jest.fn().mockResolvedValue({ items: HOLDINGS }),
      getExchangeRate: jest.fn().mockResolvedValue({ rate: '1366.2', midRate: '1365.7', rateChangeType: 'DOWN' }),
      getOrders: jest.fn().mockResolvedValue({ orders: OPEN_ORDERS, nextCursor: null, hasNext: false }),
      getBuyingPower: jest.fn((currency: string) => Promise.resolve(currency === 'USD' ? '6648.82' : '437')),
    };
    hub = { getPrice: jest.fn((symbol: string) => Promise.resolve(hubPrice(symbol, prices[symbol]))) };
    status = { getCalendar: jest.fn().mockResolvedValue(CALENDAR) };
    service = new LaofusLiveService(
      toss as unknown as TossClientService,
      hub as unknown as TossPriceHubService,
      status as unknown as LaofusStatusService,
    );
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('3종목을 VR·무매·스페이스X 순서로 현재가·보유·손익과 함께 내려준다', async () => {
    const live = await service.getLive();

    expect(live.symbols.map((s) => [s.symbol, s.label])).toEqual([
      ['TQQQ', 'VR'],
      ['SOXL', '무한매수법'],
      ['SPCX', '스페이스X'],
    ]);
    const tqqq = live.symbols[0];
    expect(tqqq.price).toBe(79.53);
    expect(tqqq.quantity).toBe(57);
    expect(tqqq.marketValueUsd).toBe(4533.21);
    expect(tqqq.profitPct).toBe(10.72);
    expect(tqqq.changePct).toBe(2.08);
    expect(live.symbols[1].changePct).toBe(2.28);
    expect(live.partial).toBe(false);
  });

  it('총 평가금·손익·원화 환산을 실시간 가격으로 계산한다', async () => {
    const live = await service.getLive();

    expect(live.fx).toBe(1366.2);
    expect(live.totals?.marketValueUsd).toBe(5758.96);
    expect(live.totals?.marketValueKrw).toBe(7867892);
    expect(live.totals?.profitUsd).toBe(478.86);
    expect(live.totals?.profitPct).toBe(9.07);
  });

  it('총 자산은 주식 평가금 + 달러 잔고이고, 원화는 환율 환산에 원화 잔고를 더한다', async () => {
    const live = await service.getLive();

    expect(live.totals?.cashUsd).toBe(6648.82);
    expect(live.totals?.cashKrw).toBe(437);
    expect(live.totals?.totalAssetsUsd).toBe(12407.78);
    expect(live.totals?.totalAssetsKrw).toBe(Math.round(12407.7804 * 1366.2 + 437));
  });

  it('잔고 조회가 실패해도 주식 합계는 내려주고 총 자산만 비운다', async () => {
    toss.getBuyingPower.mockRejectedValue(new Error('429'));

    const live = await service.getLive();

    expect(live.totals?.marketValueUsd).toBe(5758.96);
    expect(live.totals?.cashUsd).toBeNull();
    expect(live.totals?.totalAssetsUsd).toBeNull();
    expect(live.totals?.totalAssetsKrw).toBeNull();
  });

  it('주문을 현재가 대비 거리와 함께 매수→매도 순, 각각 현재가에서 가까운 순으로 정렬한다', async () => {
    const live = await service.getLive();

    const soxl = live.symbols[1].orders.map((o) => [o.side, o.type, o.price, o.distancePct]);
    expect(soxl).toEqual([
      ['BUY', 'LOC', 146.21, -3.3],
      ['BUY', 'LOC', 163.75, 8.3],
      ['SELL', 'LOC', 163.76, 8.31],
      ['SELL', '지정가', 175.46, 16.04],
    ]);
    const tqqq = live.symbols[0].orders.map((o) => [o.side, o.price, o.distancePct]);
    expect(tqqq).toEqual([
      ['BUY', 73.18, -7.98],
      ['BUY', 70.7, -11.1],
      ['SELL', 99.01, 24.49],
      ['SELL', 102.61, 29.02],
    ]);
  });

  it('경고는 무매 LOC 매수가 현재가에서 15% 이상 벌어졌을 때만 켠다', async () => {
    expect((await service.getLive()).symbols.flatMap((s) => s.orders).some((o) => o.alert)).toBe(false);

    toss.getOrders.mockResolvedValue({
      orders: [
        order('SOXL', 'BUY', 'CLS', '1', '128.50'), // −15.01% LOC 매수 → 경고
        order('SOXL', 'SELL', 'DAY', '6', '175.46'), // +16% 이지만 매도 → 경고 아님
        order('TQQQ', 'BUY', 'DAY', '1', '60'), // −24% 이지만 VR 계단 → 경고 아님
      ],
      nextCursor: null,
      hasNext: false,
    });
    const fresh = new LaofusLiveService(
      toss as unknown as TossClientService,
      hub as unknown as TossPriceHubService,
      status as unknown as LaofusStatusService,
    );
    jest.spyOn(fresh['logger'], 'warn').mockImplementation(() => undefined);
    const live = await fresh.getLive();

    const alerts = live.symbols.flatMap((s) => s.orders.filter((o) => o.alert).map((o) => [s.symbol, o.price]));
    expect(alerts).toEqual([['SOXL', 128.5]]);
  });

  it('시장가 주문은 가격 없이 "시장가"로 내려주고 거리는 비운다', async () => {
    toss.getOrders.mockResolvedValue({
      orders: [{ ...order('SPCX', 'BUY', 'DAY', '0.013209', '0'), orderType: 'MARKET', price: null, orderAmount: '2' }],
      nextCursor: null,
      hasNext: false,
    });

    const live = await service.getLive();

    expect(live.symbols[2].orders).toEqual([
      expect.objectContaining({
        side: 'BUY',
        type: '시장가',
        quantity: 0.013209,
        amount: 2,
        price: null,
        distancePct: null,
        alert: false,
      }),
    ]);
  });

  it('지정가 주문에 토스가 가격×수량 orderAmount를 줘도 주문 금액(amount)은 비운다', async () => {
    toss.getOrders.mockResolvedValue({
      orders: [{ ...order('TQQQ', 'BUY', 'DAY', '1', '73.18'), orderAmount: '73.18' }],
      nextCursor: null,
      hasNext: false,
    });

    const live = await service.getLive();

    expect(live.symbols[0].orders[0]).toMatchObject({ price: 73.18, amount: null, quantity: 1 });
  });

  it('장 상태(프리마켓)와 다음 정규장 개장 시각을 포함한다', async () => {
    const live = await service.getLive();

    expect(live.session?.session).toBe('PRE');
    expect(live.session?.nextRegularOpenAt).toBe(new Date('2026-10-01T22:30:00+09:00').toISOString());
  });

  it('보유·미체결·장 일정은 30초 안에 다시 조회하지 않는다', async () => {
    await service.getLive();
    jest.setSystemTime(new Date('2026-10-01T20:47:10+09:00'));
    await service.getLive();

    expect(toss.getHoldingsAll).toHaveBeenCalledTimes(1);
    expect(toss.getOrders).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2026-10-01T20:47:30+09:00'));
    await service.getLive();
    expect(toss.getHoldingsAll).toHaveBeenCalledTimes(2);
  });

  it('보유 조회가 실패해도 가격은 내려주고 partial로 표시한다', async () => {
    toss.getHoldingsAll.mockRejectedValue(new Error('429'));

    const live = await service.getLive();

    expect(live.partial).toBe(true);
    expect(live.totals).toBeNull();
    expect(live.symbols[0].price).toBe(79.53);
    expect(live.symbols[0].quantity).toBeNull();
  });

  it('허브에 가격이 없으면 보유 조회의 마지막 가격을 쓰고 stale로 표시한다', async () => {
    hub.getPrice.mockRejectedValue(new Error('시세 없음'));

    const live = await service.getLive();

    expect(live.partial).toBe(true);
    expect(live.symbols[1].price).toBe(151.2);
    expect(live.symbols[1].stale).toBe(true);
  });
});
