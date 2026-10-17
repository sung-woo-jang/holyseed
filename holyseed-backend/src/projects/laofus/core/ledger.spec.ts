import { computeLedgerSummary, LedgerRowInput } from './ledger';

const row = (p: Partial<LedgerRowInput> & Pick<LedgerRowInput, 'ledgerId' | 'category' | 'currency'>): LedgerRowInput => ({
  occurredAt: new Date('2026-01-01T03:00:00Z'),
  stockName: null,
  stockCode: null,
  quantityDelta: null,
  cashDelta: null,
  status: '결제완료',
  ...p,
});

describe('computeLedgerSummary — 넣은 돈과 손익 분해', () => {
  const rows: LedgerRowInput[] = [
    row({ ledgerId: 'KRW-1', currency: 'KRW', category: '외부입금', cashDelta: 2_800_000 }),
    row({ ledgerId: 'KRW-2', currency: 'KRW', category: '환전출금', cashDelta: -2_800_000 }),
    row({ ledgerId: 'USD-1', currency: 'USD', category: '환전입금', cashDelta: 2000 }),
    row({ ledgerId: 'USD-2', currency: 'USD', category: '매수', stockName: 'A', stockCode: 'A', quantityDelta: 10, cashDelta: -1000, occurredAt: new Date('2026-01-05T03:00:00Z') }),
    row({ ledgerId: 'USD-3', currency: 'USD', category: '매도', stockName: 'A', stockCode: 'A', quantityDelta: -4, cashDelta: 600, occurredAt: new Date('2026-02-05T03:00:00Z') }),
    row({ ledgerId: 'USD-4', currency: 'USD', category: '배당', stockName: 'A', stockCode: 'A', cashDelta: 10, occurredAt: new Date('2026-02-06T03:00:00Z') }),
  ];
  const base = { fxMid: 1500, fxRate: 1501, now: new Date('2026-03-10T03:00:00Z') };

  it('총손익이 실현·평가·배당·환차로 정확히 나뉜다', () => {
    const s = computeLedgerSummary({ rows, quotes: new Map([['A', { symbol: 'A', price: 120 }]]), ...base });
    expect(s.ext.net).toBe(2_800_000);
    expect(s.usd.cash).toBe(1610);
    expect(s.usd.real).toBe(200); // 600 − 평균 100 × 4주
    expect(s.usd.unreal).toBe(120); // 6주 × (120 − 100)
    expect(s.usd.inc).toBe(10);
    expect(s.usd.assets).toBe(2330);
    expect(s.total.val).toBe(3_495_000);
    expect(s.total.pl).toBe(695_000);
    expect(s.total.stockKrw + s.total.incKrw + s.total.fxKrw + s.total.krwKrw).toBe(s.total.pl);
    expect(s.total.fxKrw).toBe(200_000); // 달러 2000개를 1400원에 사서 지금 1500원
    expect(s.hold).toHaveLength(1);
    expect(s.stocks[0]).toMatchObject({ name: 'A', real: 200, held: true });
  });

  it('환전은 넣은 돈에 세지 않고, 환전출금이 있어도 순입금은 입금−출금이다', () => {
    const s = computeLedgerSummary({
      rows: [...rows, row({ ledgerId: 'KRW-3', currency: 'KRW', category: '외부출금', cashDelta: -100_000 })],
      quotes: new Map([['A', { symbol: 'A', price: 120 }]]),
      ...base,
    });
    expect(s.ext).toMatchObject({ in: 2_800_000, out: 100_000, net: 2_700_000, nIn: 1, nOut: 1 });
  });

  it('분할출고로 수량이 잠깐 0이 돼도 원가가 이어진다', () => {
    const split: LedgerRowInput[] = [
      ...rows,
      row({ ledgerId: 'USD-5', currency: 'USD', category: '분할출고', stockName: 'A', stockCode: 'A', quantityDelta: -6, occurredAt: new Date('2026-02-10T03:00:00Z') }),
      row({ ledgerId: 'USD-6', currency: 'USD', category: '분할입고', stockName: 'A', stockCode: 'A', quantityDelta: 12, occurredAt: new Date('2026-02-10T03:05:00Z') }),
    ];
    const s = computeLedgerSummary({ rows: split, quotes: new Map([['A', { symbol: 'A', price: 60 }]]), ...base });
    expect(s.hold[0]).toMatchObject({ q: 12, cost: 600, mv: 720, pl: 120 });
  });

  it('시세를 못 가져온 종목은 원가로 평가해 평가손익이 0이고 개수를 알려 준다', () => {
    const s = computeLedgerSummary({ rows, quotes: new Map(), ...base });
    expect(s.usd.unreal).toBe(0);
    expect(s.counts.unquoted).toBe(1);
    expect(s.hold[0].quoted).toBe(false);
  });

  it('결제대기 매수는 보유와 현금에 반영되고 대기 건수로 센다', () => {
    const s = computeLedgerSummary({
      rows: [...rows, row({ ledgerId: 'P-1', currency: 'USD', category: '매수', stockName: 'A', stockCode: 'A', quantityDelta: 1, cashDelta: -100, status: '결제대기', occurredAt: new Date('2026-03-09T15:00:00Z') })],
      quotes: new Map([['A', { symbol: 'A', price: 120 }]]),
      ...base,
    });
    expect(s.counts).toMatchObject({ pending: 1, pendingAmt: 100 });
    expect(s.usd.cash).toBe(1510);
    expect(s.hold[0].q).toBe(7);
  });

  it('월별 시계열은 첫 입금 달부터 이번 달까지 빈 달도 이어서 채운다', () => {
    const s = computeLedgerSummary({ rows, quotes: new Map([['A', { symbol: 'A', price: 120 }]]), ...base });
    expect(s.series.map((p) => p.m)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(s.series[2].c).toBe(2_800_000);
  });
});
