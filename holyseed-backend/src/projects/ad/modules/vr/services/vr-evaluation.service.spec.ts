import { VrEvaluationService } from './vr-evaluation.service';

function make(candles: Array<{ timestamp: string; closePrice: string }>, live = 70) {
  const toss = { getCandles: jest.fn().mockResolvedValue({ candles, nextBefore: null }) };
  const hub = { getPrice: jest.fn().mockResolvedValue({ price: live }) };
  const svc = new VrEvaluationService(toss as never, hub as never);
  return { svc, toss, hub };
}

const candles = [
  { timestamp: '2026-09-24T20:00:00Z', closePrice: '66.10' },
  { timestamp: '2026-09-25T20:00:00Z', closePrice: '67.40' },
  { timestamp: '2026-09-28T20:00:00Z', closePrice: '68.90' },
];

describe('VrEvaluationService.resolvePrice', () => {
  it('사이클 종료 후 이틀 이상 지났으면 종료일 종가를 쓴다', async () => {
    const { svc, hub } = make(candles);
    const r = await svc.resolvePrice('2026-09-25', '2026-09-28');
    expect(r).toEqual({ price: 67.4, date: '2026-09-25', source: 'CLOSE' });
    expect(hub.getPrice).not.toHaveBeenCalled();
  });

  it('종료일이 휴장이면 그 이전 마지막 거래일 종가를 쓴다', async () => {
    const { svc } = make(candles);
    const r = await svc.resolvePrice('2026-09-27', '2026-09-29');
    expect(r.date).toBe('2026-09-25');
  });

  it('종료일 당일·다음 날은 현재가를 쓴다', async () => {
    const { svc, toss } = make(candles, 71.5);
    expect((await svc.resolvePrice('2026-09-25', '2026-09-25')).source).toBe('LIVE');
    expect((await svc.resolvePrice('2026-09-25', '2026-09-26')).price).toBe(71.5);
    expect(toss.getCandles).not.toHaveBeenCalled();
  });

  it('일봉에 해당 날짜 이전 데이터가 없으면 현재가로 대체한다', async () => {
    const { svc } = make(candles, 72);
    expect((await svc.resolvePrice('2026-08-01', '2026-09-28')).source).toBe('LIVE');
  });
});
