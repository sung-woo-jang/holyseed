/**
 * 토스증권 원장(laofus.ledger_entries) → "넣은 돈 / 지금 평가액 / 총손익" 계산.
 * DB·토스 호출 없이 입력만으로 계산하는 순수 함수라 테스트하기 쉽다.
 *
 * 정의
 * - 넣은 돈(순입금) = 외부입금 합 − 외부출금 합 (원화). 환전은 계좌 안 이동이라 세지 않는다.
 * - 평가액 = (달러 현금 + 보유 평가) × 환율 + 원화 현금. 결제대기 체결도 보유·현금에 반영한다.
 * - 총손익 = 평가액 − 넣은 돈. 아래처럼 정확히 나뉜다.
 *     (실현 + 평가 + 배당·이자) × 환율  +  순매입 달러 × (환율 − 평균 매입 환율)  +  원화 계좌 손익
 * - 실현손익은 종목별 이동평균 원가(수수료·세금 반영). 같은 시각 기록은 원장ID 번호가 큰 쪽을 먼저 처리한다
 *   (토스가 최신순으로 번호를 매기기 때문).
 */

export interface LedgerRowInput {
  ledgerId: string;
  occurredAt: Date;
  currency: 'KRW' | 'USD';
  category: string;
  stockName: string | null;
  stockCode: string | null;
  quantityDelta: number | null;
  cashDelta: number | null;
  status: string;
}

export interface LedgerQuote {
  symbol: string;
  price: number;
}

export interface LedgerSummaryInput {
  rows: LedgerRowInput[];
  /** 종목명 → 현재가 (토스 보유 목록 기준). 없는 종목은 원가로 평가해 평가손익 0 */
  quotes: Map<string, LedgerQuote>;
  /** 달러 환율 중간값 */
  fxMid: number;
  fxRate: number;
  now: Date;
}

export interface LedgerMonthPoint {
  m: string;
  i: number;
  o: number;
  c: number;
}

export interface LedgerHolding {
  sym: string;
  name: string;
  q: number;
  cost: number;
  price: number;
  mv: number;
  pl: number;
  quoted: boolean;
}

export interface LedgerStockPl {
  name: string;
  real: number;
  held: boolean;
  n: number;
}

export interface LedgerSummary {
  asof: string;
  fx: { rate: number; mid: number };
  ext: { in: number; out: number; net: number; nIn: number; nOut: number; first: string | null };
  series: LedgerMonthPoint[];
  years: { y: string; i: number; o: number; n: number }[];
  ex: { krwOut: number; usdIn: number; usdOut: number; krwIn: number; netUsd: number; netKrw: number; rAvg: number; rIn: number; rOut: number; nIn: number; nOut: number };
  krw: { cash: number; pl: number };
  usd: { cash: number; mv: number; assets: number; real: number; unreal: number; inc: number; pl: number };
  total: { val: number; pl: number; rate: number; xirr: number | null; stockKrw: number; incKrw: number; fxKrw: number; krwKrw: number };
  hold: LedgerHolding[];
  stocks: LedgerStockPl[];
  counts: { records: number; pending: number; pendingAmt: number; firstDate: string | null; lastDate: string | null; unquoted: number };
}

const EXT_IN = '외부입금';
const EXT_OUT = '외부출금';
const TRADE_CATEGORIES = new Set(['매수', '매도', '이벤트입고', '분할입고', '분할출고']);
const QTY_EPS = 1e-6;

const num = (v: number | null): number => (v === null || Number.isNaN(v) ? 0 : v);
const kstIso = (d: Date): string => new Date(d.getTime() + 9 * 3600e3).toISOString();
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** 원장ID 끝 순번 (같은 시각 기록 정렬용) */
function ledgerSeq(id: string): number {
  const m = /-(\d+)$/.exec(id);
  return m ? Number(m[1]) : 0;
}

/** 거래 처리 순서: 시각 오름차순, 같은 시각이면 순번 내림차순. 결제대기는 그날의 맨 뒤 */
function tradeOrderKey(r: LedgerRowInput): string {
  const iso = kstIso(r.occurredAt);
  return r.status === '결제대기' ? `${iso.slice(0, 10)}T23:59:59` : iso.slice(0, 19);
}

function xirr(flows: { date: Date; amount: number }[]): number | null {
  if (flows.length < 2) return null;
  const t0 = Math.min(...flows.map((f) => f.date.getTime()));
  const npv = (r: number) => flows.reduce((a, f) => a + f.amount / (1 + r) ** ((f.date.getTime() - t0) / 86400e3 / 365), 0);
  let lo = -0.9;
  let hi = 5;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

interface Position {
  name: string;
  code: string;
  q: number;
  cost: number;
  real: number;
  n: number;
}

export function computeLedgerSummary(input: LedgerSummaryInput): LedgerSummary {
  const { rows, quotes, fxMid, fxRate, now } = input;
  const mid = fxMid;

  // ---- 외부 입출금
  const ext = rows.filter((r) => r.category === EXT_IN || r.category === EXT_OUT).sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const extIn = ext.filter((r) => r.category === EXT_IN).reduce((a, r) => a + num(r.cashDelta), 0);
  const extOut = ext.filter((r) => r.category === EXT_OUT).reduce((a, r) => a - num(r.cashDelta), 0);
  const extNet = extIn - extOut;

  const monthMap = new Map<string, { i: number; o: number }>();
  const yearMap = new Map<string, { i: number; o: number; n: number }>();
  for (const r of ext) {
    const iso = kstIso(r.occurredAt);
    const m = monthMap.get(iso.slice(0, 7)) ?? { i: 0, o: 0 };
    const y = yearMap.get(iso.slice(0, 4)) ?? { i: 0, o: 0, n: 0 };
    if (r.category === EXT_IN) {
      m.i += num(r.cashDelta);
      y.i += num(r.cashDelta);
    } else {
      m.o -= num(r.cashDelta);
      y.o -= num(r.cashDelta);
    }
    y.n += 1;
    monthMap.set(iso.slice(0, 7), m);
    yearMap.set(iso.slice(0, 4), y);
  }
  const series: LedgerMonthPoint[] = [];
  if (ext.length > 0) {
    const [fy, fm] = kstIso(ext[0].occurredAt).slice(0, 7).split('-').map(Number);
    const [ly, lm] = kstIso(now).slice(0, 7).split('-').map(Number);
    let cum = 0;
    let y = fy;
    let m = fm;
    while (y < ly || (y === ly && m <= lm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const v = monthMap.get(key) ?? { i: 0, o: 0 };
      cum += v.i - v.o;
      series.push({ m: key, i: Math.round(v.i), o: Math.round(v.o), c: Math.round(cum) });
      if (m === 12) {
        y += 1;
        m = 1;
      } else {
        m += 1;
      }
    }
  }

  // ---- 환전
  const sumBy = (cur: 'KRW' | 'USD', cat: string, sign: 1 | -1): number =>
    rows.filter((r) => r.currency === cur && r.category === cat).reduce((a, r) => a + sign * num(r.cashDelta), 0);
  const krwOut = sumBy('KRW', '환전출금', -1);
  const krwIn = sumBy('KRW', '환전입금', 1);
  const usdIn = sumBy('USD', '환전입금', 1);
  const usdOut = sumBy('USD', '환전출금', -1);
  const netUsd = usdIn - usdOut;
  const netKrw = krwOut - krwIn;
  const rAvg = netUsd > 0 ? netKrw / netUsd : 0;
  const count = (cur: 'KRW' | 'USD', cat: string) => rows.filter((r) => r.currency === cur && r.category === cat).length;

  // ---- 현금 (결제대기 체결은 이미 빠진 것으로 본다)
  const krwCash = rows.filter((r) => r.currency === 'KRW').reduce((a, r) => a + num(r.cashDelta), 0);
  const usdCash = rows.filter((r) => r.currency === 'USD').reduce((a, r) => a + num(r.cashDelta), 0);

  // ---- 종목별 이동평균 (달러 종목만. 원화 ETF는 원화 계좌 손익에 현금흐름으로 반영됨)
  const trades = rows.filter((r) => r.currency === 'USD' && TRADE_CATEGORIES.has(r.category)).sort((a, b) => {
    const ka = tradeOrderKey(a);
    const kb = tradeOrderKey(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return ledgerSeq(b.ledgerId) - ledgerSeq(a.ledgerId);
  });
  const pos = new Map<string, Position>();
  for (const r of trades) {
    const code = r.stockCode ?? r.stockName ?? '?';
    const p = pos.get(code) ?? { name: r.stockName ?? code, code, q: 0, cost: 0, real: 0, n: 0 };
    const q = num(r.quantityDelta);
    if (r.category === '매수') {
      p.q += q;
      p.cost += -num(r.cashDelta);
      p.n += 1;
    } else if (r.category === '매도') {
      const sold = -q;
      const avg = p.q > QTY_EPS ? p.cost / p.q : 0;
      p.real += num(r.cashDelta) - avg * sold;
      p.cost -= avg * sold;
      p.q -= sold;
      p.n += 1;
    } else {
      p.q += q; // 이벤트입고·분할입고·분할출고는 원가 그대로 수량만
    }
    if (Math.abs(p.q) < QTY_EPS) {
      p.q = 0;
      // 분할출고 직후처럼 수량이 잠깐 0이어도 원가는 이어져야 해서, 부동소수 찌꺼기일 때만 0으로 맞춘다
      if (Math.abs(p.cost) < 0.01) p.cost = 0;
    }
    pos.set(code, p);
  }

  let unquoted = 0;
  const hold: LedgerHolding[] = [];
  for (const p of pos.values()) {
    if (p.q <= QTY_EPS) continue;
    const quote = quotes.get(p.name);
    if (!quote) unquoted += 1;
    const price = quote ? quote.price : p.cost / p.q;
    const mv = p.q * price;
    hold.push({ sym: quote?.symbol ?? p.name, name: p.name, q: p.q, cost: round2(p.cost), price, mv: round2(mv), pl: round2(mv - p.cost), quoted: !!quote });
  }
  hold.sort((a, b) => b.mv - a.mv);

  const real = [...pos.values()].reduce((a, p) => a + p.real, 0);
  const holdMv = hold.reduce((a, h) => a + h.mv, 0);
  const holdCost = hold.reduce((a, h) => a + h.cost, 0);
  const unreal = holdMv - holdCost;
  const inc = rows
    .filter((r) => r.currency === 'USD' && (r.category === '배당' || r.category === '이자' || r.category === '세금환급'))
    .reduce((a, r) => a + num(r.cashDelta), 0);
  const usdAssets = usdCash + holdMv;
  const usdPl = usdAssets - netUsd;

  // ---- 원화 합산
  const krwPl = krwCash - extNet + netKrw; // 원화 계좌 안에서 생긴 손익 (ETF 매매, 이자, 분배금, 세금)
  const val = usdAssets * mid + krwCash;
  const totalPl = val - extNet;

  const flows = ext.map((r) => ({ date: r.occurredAt, amount: -num(r.cashDelta) }));
  flows.push({ date: now, amount: val });

  const stocks: LedgerStockPl[] = [...pos.values()]
    .filter((p) => p.n > 0)
    .map((p) => ({ name: p.name, real: round2(p.real), held: p.q > QTY_EPS, n: p.n }))
    .sort((a, b) => b.real - a.real);

  const pending = rows.filter((r) => r.status === '결제대기');
  const settled = rows.filter((r) => r.status !== '결제대기');
  const times = settled.map((r) => kstIso(r.occurredAt).slice(0, 10)).sort();

  return {
    asof: kstIso(now).slice(0, 10),
    fx: { rate: fxRate, mid },
    ext: { in: extIn, out: extOut, net: extNet, nIn: ext.filter((r) => r.category === EXT_IN).length, nOut: ext.filter((r) => r.category === EXT_OUT).length, first: ext.length > 0 ? kstIso(ext[0].occurredAt).slice(0, 10) : null },
    series,
    years: [...yearMap.entries()].sort().map(([y, v]) => ({ y, i: Math.round(v.i), o: Math.round(v.o), n: v.n })),
    ex: { krwOut, usdIn, usdOut, krwIn, netUsd, netKrw, rAvg, rIn: usdIn > 0 ? krwOut / usdIn : 0, rOut: usdOut > 0 ? krwIn / usdOut : 0, nIn: count('USD', '환전입금'), nOut: count('USD', '환전출금') },
    krw: { cash: krwCash, pl: krwPl },
    usd: { cash: round2(usdCash), mv: round2(holdMv), assets: round2(usdAssets), real: round2(real), unreal: round2(unreal), inc: round2(inc), pl: round2(usdPl) },
    total: {
      val: Math.round(val),
      pl: Math.round(totalPl),
      rate: extNet > 0 ? totalPl / extNet : 0,
      xirr: xirr(flows),
      stockKrw: Math.round((real + unreal) * mid),
      incKrw: Math.round(inc * mid),
      fxKrw: Math.round(netUsd * (mid - rAvg)),
      krwKrw: Math.round(krwPl),
    },
    hold,
    stocks,
    counts: {
      records: rows.length,
      pending: pending.length,
      pendingAmt: round2(pending.reduce((a, r) => a - num(r.cashDelta), 0)),
      firstDate: times[0] ?? null,
      lastDate: times[times.length - 1] ?? null,
      unquoted,
    },
  };
}
