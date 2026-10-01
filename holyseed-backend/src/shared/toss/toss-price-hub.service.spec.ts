import { TossApiError, TossClientService } from './toss-client.service';
import { TossPriceHubService } from './toss-price-hub.service';

function prices(tqqq: string, soxl: string, spcx: string) {
  const ts = '2026-10-01T21:40:34.000+09:00';
  return [
    { symbol: 'TQQQ', timestamp: ts, lastPrice: tqqq, currency: 'USD' },
    { symbol: 'SOXL', timestamp: ts, lastPrice: soxl, currency: 'USD' },
    { symbol: 'SPCX', timestamp: ts, lastPrice: spcx, currency: 'USD' },
  ];
}

function rateLimited(): TossApiError {
  return new TossApiError({ method: 'GET', path: '/api/v1/prices', status: 429, code: 'rate-limit-exceeded' });
}

describe('TossPriceHubService', () => {
  let getPrices: jest.Mock;
  let hub: TossPriceHubService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-01T12:00:00Z'));
    getPrices = jest.fn();
    hub = new TossPriceHubService({ getPrices } as unknown as TossClientService);
    jest.spyOn(hub['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('3종목을 한 번에 조회하고, 재시도 없이(retry:false) 호출한다', async () => {
    getPrices.mockResolvedValue(prices('79.44', '150.10', '151.30'));

    const p = await hub.getPrice('SOXL');

    expect(p.price).toBe(150.1);
    expect(p.stale).toBe(false);
    expect(getPrices).toHaveBeenCalledTimes(1);
    expect(getPrices).toHaveBeenCalledWith(['TQQQ', 'SOXL', 'SPCX'], { retry: false });
  });

  it('5초 안에는 값을 재사용하고, 지나면 다시 조회한다', async () => {
    getPrices
      .mockResolvedValueOnce(prices('79.44', '150.10', '151.30'))
      .mockResolvedValueOnce(prices('80', '151', '152'));

    await hub.getPrice('TQQQ');
    jest.setSystemTime(new Date('2026-10-01T12:00:04Z'));
    expect((await hub.getPrice('TQQQ')).price).toBe(79.44);
    expect(getPrices).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2026-10-01T12:00:06Z'));
    expect((await hub.getPrice('TQQQ')).price).toBe(80);
    expect(getPrices).toHaveBeenCalledTimes(2);
  });

  it('동시에 들어온 요청은 토스 호출 하나로 합친다', async () => {
    getPrices.mockResolvedValue(prices('79.44', '150.10', '151.30'));

    const [a, b, c] = await Promise.all([hub.getPrice('TQQQ'), hub.getPrice('SOXL'), hub.getPrice('SPCX')]);

    expect([a.price, b.price, c.price]).toEqual([79.44, 150.1, 151.3]);
    expect(getPrices).toHaveBeenCalledTimes(1);
  });

  it('429를 받으면 30초간 호출을 멈추고 마지막 값을 돌려준다', async () => {
    getPrices.mockResolvedValueOnce(prices('79.44', '150.10', '151.30')).mockRejectedValue(rateLimited());
    await hub.getPrice('TQQQ');

    jest.setSystemTime(new Date('2026-10-01T12:00:06Z'));
    const during = await hub.getPrice('TQQQ');
    expect(during.price).toBe(79.44);
    expect(getPrices).toHaveBeenCalledTimes(2);

    jest.setSystemTime(new Date('2026-10-01T12:00:30Z'));
    await hub.getPrice('TQQQ');
    expect(getPrices).toHaveBeenCalledTimes(2);

    jest.setSystemTime(new Date('2026-10-01T12:00:37Z'));
    await hub.getPrice('TQQQ');
    expect(getPrices).toHaveBeenCalledTimes(3);
  });

  it('갱신이 20초 넘게 실패하면 stale로 표시한다', async () => {
    getPrices.mockResolvedValueOnce(prices('79.44', '150.10', '151.30')).mockRejectedValue(rateLimited());
    await hub.getPrice('TQQQ');

    jest.setSystemTime(new Date('2026-10-01T12:00:10Z'));
    expect((await hub.getPrice('TQQQ')).stale).toBe(false);

    jest.setSystemTime(new Date('2026-10-01T12:00:25Z'));
    expect((await hub.getPrice('TQQQ')).stale).toBe(true);
  });

  it('값을 한 번도 못 받았으면 원래 에러를 그대로 던진다', async () => {
    getPrices.mockRejectedValue(rateLimited());

    await expect(hub.getPrice('TQQQ')).rejects.toBeInstanceOf(TossApiError);
  });

  it('429가 아닌 실패는 3초 뒤 다시 시도한다', async () => {
    getPrices.mockRejectedValueOnce(new Error('network down')).mockResolvedValue(prices('79.44', '150.10', '151.30'));

    await expect(hub.getPrice('TQQQ')).rejects.toThrow('network down');
    await expect(hub.getPrice('TQQQ')).rejects.toThrow('network down');
    expect(getPrices).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2026-10-01T12:00:04Z'));
    expect((await hub.getPrice('TQQQ')).price).toBe(79.44);
    expect(getPrices).toHaveBeenCalledTimes(2);
  });
});
