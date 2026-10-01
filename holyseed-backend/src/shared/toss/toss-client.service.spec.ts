import { TossApiError, TossClientService } from './toss-client.service';

type FetchMock = jest.Mock<Promise<Response>, [string, RequestInit?]>;

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

const OK_PRICES = {
  result: [{ symbol: 'TQQQ', timestamp: '2026-10-01T21:40:34.000+09:00', lastPrice: '79.44', currency: 'USD' }],
};
const RATE_LIMITED = {
  error: {
    requestId: 'udwS2DnGe0KNWoKt',
    code: 'rate-limit-exceeded',
    message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  },
};

describe('TossClientService.request', () => {
  let service: TossClientService;
  let fetchMock: FetchMock;
  let sleepSpy: jest.SpyInstance;
  const realFetch = global.fetch;

  beforeEach(() => {
    service = new TossClientService();
    // 토큰 캐시 파일·네트워크를 건드리지 않도록 유효 토큰을 미리 주입
    (service as unknown as { token: string; tokenExpiresAt: number; accountSeq: number }).token = 'test-token';
    (service as unknown as { tokenExpiresAt: number }).tokenExpiresAt = Date.now() + 3_600_000;
    (service as unknown as { accountSeq: number }).accountSeq = 3;
    sleepSpy = jest.spyOn(service as unknown as { sleep: () => Promise<void> }, 'sleep').mockResolvedValue(undefined);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('GET 429는 Retry-After 만큼 기다린 뒤 재시도해서 성공한다', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(429, RATE_LIMITED, { 'retry-after': '2' }))
      .mockResolvedValueOnce(jsonResponse(200, OK_PRICES));

    const price = await service.getPrice('TQQQ');

    expect(price.lastPrice).toBe('79.44');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepSpy).toHaveBeenCalledWith(2000);
  });

  it('GET 429가 계속되면 3회 재시도 후 코드·요청 ID가 담긴 TossApiError를 던진다', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse(429, RATE_LIMITED, { 'retry-after': '1', 'x-ratelimit-limit': '15' })),
    );

    const err = await service.getPrice('TQQQ').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(TossApiError);
    const e = err as TossApiError;
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(e.status).toBe(429);
    expect(e.code).toBe('rate-limit-exceeded');
    expect(e.requestId).toBe('udwS2DnGe0KNWoKt');
    expect(e.retries).toBe(3);
    expect(e.rateLimit?.limit).toBe('15');
    expect(e.message).toBe(
      '429 요청 한도 초과 · rate-limit-exceeded · GET /prices · 재시도 3회 실패 · 요청 ID udwS2DnGe0KNWoKt',
    );
  });

  it('Retry-After가 너무 길면 기다리지 않고 바로 실패한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, RATE_LIMITED, { 'retry-after': '60' }));

    await expect(service.getPrice('TQQQ')).rejects.toBeInstanceOf(TossApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepSpy).not.toHaveBeenCalled();
  });

  it('주문(POST)은 429여도 재시도하지 않는다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, RATE_LIMITED, { 'retry-after': '1' }));

    const err = await service.buyLoc('SOXL', '1', '150.00', 'cid-1').catch((e: unknown) => e);

    expect(err).toBeInstanceOf(TossApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepSpy).not.toHaveBeenCalled();
    expect((err as TossApiError).retries).toBe(0);
  });

  it('GET 5xx는 재시도하고, 4xx(429 제외)는 재시도하지 않는다', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { error: { code: 'maintenance', message: '점검 중', requestId: 'r1' } }))
      .mockResolvedValueOnce(jsonResponse(200, OK_PRICES));
    await expect(service.getPrice('TQQQ')).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      jsonResponse(404, { error: { code: 'stock-not-found', message: '없음', requestId: 'r2' } }),
    );
    await expect(service.getPrice('NOPE')).rejects.toMatchObject({ status: 404, code: 'stock-not-found' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('422 주문 불가 시간은 다시 가능한 시각을 메시지에 담는다', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        error: {
          requestId: 'oiamSndIyjjLgWm2',
          code: 'order-hours-closed',
          message: '지금은 LOC 주문을 할 수 없어요.',
          data: { retryAfterAt: '2026-09-24T09:00:00+09:00' },
        },
      }),
    );

    const err = (await service.buyLoc('SOXL', '1', '150.00', 'cid-2').catch((e: unknown) => e)) as TossApiError;

    expect(err.message).toBe(
      '422 주문 불가 시간 · 9. 24. 09:00 이후 가능 · order-hours-closed · POST /orders · 요청 ID oiamSndIyjjLgWm2',
    );
    expect(err.data?.retryAfterAt).toBe('2026-09-24T09:00:00+09:00');
  });

  it('주문 ID가 긴 경로는 메시지에서 줄여서 보여준다', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, { error: { code: 'order-not-found', message: 'x', requestId: 'r3' } }),
    );

    const err = (await service
      .getOrder('v8SiG69WslKaUoPBbT-4G31UilcawNvVQRAB6Ippi34Ira77QTMptLXatglH-AVN')
      .catch((e: unknown) => e)) as TossApiError;

    expect(err.message).toContain('GET /orders/v8SiG69W…');
    expect(err.message).not.toContain('QTMptLXatglH');
  });

  it('JSON이 아닌 에러 본문도 상태 코드와 함께 TossApiError로 던진다', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Bad Gateway', { status: 502 }));

    const err = (await service.buyLoc('SOXL', '1', '150.00', 'cid-3').catch((e: unknown) => e)) as TossApiError;

    expect(err).toBeInstanceOf(TossApiError);
    expect(err.status).toBe(502);
    expect(err.message).toContain('502 Bad Gateway');
  });

  it('401이면 토큰을 재발급하고 한 번만 다시 요청한다 (기존 동작 유지)', async () => {
    const fetchToken = jest
      .spyOn(service as unknown as { fetchToken: () => Promise<void> }, 'fetchToken')
      .mockImplementation(() => {
        (service as unknown as { token: string }).token = 'fresh-token';
        return Promise.resolve();
      });
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(401, { error: { code: 'expired-token', message: 'expired', requestId: 'r4' } }),
      )
      .mockResolvedValueOnce(jsonResponse(200, OK_PRICES));

    await expect(service.getPrice('TQQQ')).resolves.toBeDefined();

    expect(fetchToken).toHaveBeenCalledTimes(1);
    const retryHeaders = fetchMock.mock.calls[1][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer fresh-token');
  });

  it('401이 재발급 후에도 반복되면 더 시도하지 않고 실패한다', async () => {
    const fetchToken = jest
      .spyOn(service as unknown as { fetchToken: () => Promise<void> }, 'fetchToken')
      .mockResolvedValue(undefined);
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse(401, { error: { code: 'invalid-token', message: 'bad', requestId: 'r5' } })),
    );

    await expect(service.getPrice('TQQQ')).rejects.toMatchObject({ status: 401, code: 'invalid-token' });

    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('getPrices는 여러 종목을 symbols 쿼리 하나로 조회한다', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, OK_PRICES));

    await service.getPrices(['TQQQ', 'SOXL', 'SPCX']);

    expect(fetchMock.mock.calls[0][0]).toBe('https://openapi.tossinvest.com/api/v1/prices?symbols=TQQQ%2CSOXL%2CSPCX');
    await expect(service.getPrices([])).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
