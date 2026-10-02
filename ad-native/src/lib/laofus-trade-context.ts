/**
 * 체결 상세 화면용 순수 함수 — 체결 한 건의 "그 당시" 상태·별지점·그날 시세·걸린 주문을 거래 기록에서 재구성한다.
 * 공식은 lib/laofus-core(엔진과 동일)와 같고, 전략 시대(분할 수·주문 방식)가 바뀐 날짜는 아래 상수로 판별한다.
 */
import type { TradeDto } from '../api/laofus';

/** 이 날부터 실엔진(토스 API) 주문 기록이 있다 — 그 전은 노션에서 옮긴 근사 기록 */
export const MARKET_ERA_START = '2026-07-16';
/** 이 날부터 20분할·온주 LOC(하루 2 leg) 방식 — 그 전은 40분할·마감 전 현재가 판단 + 시장가 */
export const LOC_ERA_START = '2026-09-12';

export type TradeEra = 'MIGRATED' | 'MARKET' | 'LOC';

export const ERA_LABEL: Record<TradeEra, string> = {
  MIGRATED: '이관 기록 (~7/15)',
  MARKET: '시장가 시대 (7/16~9/11)',
  LOC: 'LOC 시대 (9/12~)',
};

export function eraOf(date: string): TradeEra {
  if (date < MARKET_ERA_START) return 'MIGRATED';
  if (date < LOC_ERA_START) return 'MARKET';
  return 'LOC';
}

export function splitsAt(date: string): 20 | 40 {
  return date < LOC_ERA_START ? 40 : 20;
}

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export interface StateSnapshot {
  T: number;
  quantity: number;
  /** 보유수량이 0이면 평단이 없다 */
  avg: number | null;
  cash: number;
}

/** 체결 직전 상태 — 체결 후 기록(평단·보유·잔금)에서 역산 */
export function stateBefore(t: TradeDto): StateSnapshot {
  const qty = n(t.quantity);
  const qtyAfter = n(t.qtyAfter);
  const avgAfter = n(t.avgAfter);
  const merged = !!t.note && t.note.includes('2-leg 병합');
  if (t.side === 'BUY') {
    const qtyBefore = qtyAfter - qty;
    const cost = merged ? n(t.amount) : n(t.price) * qty;
    const avg = qtyBefore > 1e-6 ? (avgAfter * qtyAfter - cost) / qtyBefore : null;
    return { T: n(t.tBefore), quantity: Math.max(0, qtyBefore), avg, cash: n(t.cashAfter) + n(t.amount) };
  }
  // 매도는 평단을 바꾸지 않는다
  return { T: n(t.tBefore), quantity: qtyAfter + qty, avg: avgAfter, cash: n(t.cashAfter) - n(t.amount) };
}

export function stateAfter(t: TradeDto): StateSnapshot {
  const q = n(t.qtyAfter);
  return { T: n(t.tAfter), quantity: q, avg: q > 1e-6 ? n(t.avgAfter) : null, cash: n(t.cashAfter) };
}

/** 같은 날 절반 두 건이 화면용으로 합쳐진 거래면 원 체결 DB id 둘, 아니면 자기 id */
export function rawTradeIds(t: TradeDto): number[] {
  const m = t.note ? /원 체결 #(\d+)\+#(\d+)/.exec(t.note) : null;
  return m ? [Number(m[1]), Number(m[2])] : [t.id];
}

export function isMergedLegs(t: TradeDto): boolean {
  return rawTradeIds(t).length === 2;
}

/** 같은 날(한국 기준) 주문은 같은 아침 상태에서 한꺼번에 걸리므로, 그날 첫 거래 직전 상태가 "그날의 기준 상태" */
export function dayStartTrade(trades: TradeDto[], t: TradeDto): TradeDto {
  return trades.find((x) => x.date === t.date && x.seq <= t.seq && x.kind !== '이월') ?? t;
}

export interface Levels {
  starPct: number;
  star: number;
  full: number;
  /** LOC 시대 매수 별지점 주문가 (별지점 − 0.01) */
  buyStar: number;
  oneBuy: number;
}

export function levelsFor(state: StateSnapshot, splits: number): Levels | null {
  if (state.avg == null) return null;
  const starPct = (20 - (40 / splits) * state.T) / 100;
  const star = round2(state.avg * (1 + starPct));
  return {
    starPct,
    star,
    full: round2(state.avg * 1.2),
    buyStar: round2(star - 0.01),
    oneBuy: round2(state.cash / (splits - state.T)),
  };
}

export interface CandleRow {
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
}

export interface DayCandle {
  /** 미국 정규장 날짜 */
  date: string;
  o: number;
  h: number;
  l: number;
  c: number;
  prevClose: number | null;
}

function shiftIso(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + delta));
  return dt.toISOString().slice(0, 10);
}

/**
 * 체결과 같은 날의 일봉 찾기 — 한국 날짜 −1일이 미국 정규장 날짜(마감 새벽 체결)이므로 그 날을 우선하고,
 * 체결가가 그날 저~고 범위에 들 때만 채택해 날짜 기준이 다른 옛 기록에 엉뚱한 시세를 붙이지 않는다.
 */
export function findCandle(candles: CandleRow[], t: TradeDto): DayCandle | null {
  const byDate = new Map(candles.map((c) => [c.timestamp.slice(0, 10), c]));
  const price = n(t.price);
  for (const delta of [-1, 0, -2]) {
    const date = shiftIso(t.date, delta);
    const c = byDate.get(date);
    if (!c) continue;
    if (price < n(c.lowPrice) - 0.011 || price > n(c.highPrice) + 0.011) continue;
    // 직전 거래일 종가 — 주말·휴장을 건너뛰도록 최대 5일 전까지 탐색
    let prevClose: number | null = null;
    for (let k = 1; k <= 5 && prevClose == null; k++) {
      const p = byDate.get(shiftIso(date, -k));
      if (p) prevClose = n(p.closePrice);
    }
    return { date, o: n(c.openPrice), h: n(c.highPrice), l: n(c.lowPrice), c: n(c.closePrice), prevClose };
  }
  return null;
}

export interface OrderLogRow {
  id: number;
  cycleId: number;
  side: string;
  kind: string;
  leg: number | null;
  tBefore: number;
  tAfter: number;
  requestAmount: number | null;
  requestQuantity: number | null;
  status: string;
  appliedTradeId: number | null;
  placedAt: string;
}

export type OrderOutcome = '체결' | '미체결' | '거부';

export interface OrderView {
  key: number;
  title: string;
  detail: string;
  outcome: OrderOutcome;
  mine: boolean;
}

const ORDER_GROUP_WINDOW_MS = 10 * 60_000;

/** 이 거래를 만든 주문과 같은 접수 시각대(10분 이내)·같은 사이클에 낸 주문들 */
export function sameDayOrders(orders: OrderLogRow[], t: TradeDto): { orders: OrderLogRow[]; mineIds: Set<number> } {
  const ids = new Set(rawTradeIds(t));
  const mine = orders.filter((o) => o.appliedTradeId != null && ids.has(o.appliedTradeId));
  if (mine.length === 0) return { orders: [], mineIds: new Set() };
  const anchor = new Date(mine[0]!.placedAt).getTime();
  const group = orders.filter(
    (o) => o.cycleId === mine[0]!.cycleId && Math.abs(new Date(o.placedAt).getTime() - anchor) <= ORDER_GROUP_WINDOW_MS,
  );
  return { orders: group, mineIds: new Set(mine.map((o) => o.id)) };
}

function usd(v: number, d = 2): string {
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${v < 0 ? '−' : ''}$${s}`;
}

/** 주문 한 건을 화면 문구로 — LOC 시대는 지정가를 기준 상태에서 재계산하고, 체결 안 된 주문은 일봉으로 조건 충족 여부를 가린다 */
export function describeOrders(args: {
  rows: OrderLogRow[];
  mineIds: Set<number>;
  levels: Levels | null;
  firstHalf: boolean;
  avg: number | null;
  candle: DayCandle | null;
}): OrderView[] {
  const { rows, mineIds, levels, firstHalf, avg, candle } = args;
  const sorted = [...rows].sort((a, b) => (a.side === b.side ? a.id - b.id : a.side === 'BUY' ? -1 : 1));
  return sorted.map((o) => {
    const mine = mineIds.has(o.id);
    const applied = o.status === 'APPLIED';
    let title = '';
    let detail = '';
    let conditionMet: boolean | null = null;

    if (o.side === 'BUY' && o.leg != null && levels) {
      // leg 번호 대신 주문 금액이 어느 기준가(별지점/평단)의 정수배에 가까운지로 역할을 가른다 — 수동 보정 주문이 섞인 날도 틀리지 않게
      const amount = o.requestAmount ?? levels.buyStar;
      const candidates = [
        { star: true, price: levels.buyStar },
        ...(avg != null && firstHalf ? [{ star: false, price: avg }] : []),
      ].map((c) => {
        const qty = Math.max(1, Math.round(amount / c.price));
        return { ...c, qty, err: Math.abs(amount - qty * c.price) };
      });
      const pick = candidates.reduce((best, c) => (c.err < best.err ? c : best));
      const limit = round2(amount / pick.qty);
      title = `매수 · ${pick.star ? '별지점' : '평단'} LOC`;
      detail = `${usd(limit)} 이하 · ${pick.qty}주`;
      if (candle) conditionMet = candle.c <= limit + 1e-9;
    } else if (o.side === 'SELL' && o.leg != null && levels) {
      const quarter = o.kind === '쿼터매도';
      const limit = quarter ? levels.star : levels.full;
      const qty = o.requestQuantity ?? 0;
      title = quarter ? '매도 · 쿼터 LOC' : '매도 · 전량 지정가';
      detail = `${quarter ? '별지점 ' : ''}${usd(limit)} 이상 · ${qty}주`;
      if (candle) conditionMet = quarter ? candle.c >= limit - 1e-9 : candle.h >= limit - 1e-9;
    } else if (o.side === 'BUY') {
      title = `매수 · ${o.kind} 시장가`;
      detail = `${usd(o.requestAmount ?? 0)} 금액 주문`;
    } else {
      title = `매도 · ${o.kind} 시장가`;
      detail = `${o.requestQuantity ?? 0}주`;
    }

    let outcome: OrderOutcome = '체결';
    if (!applied) {
      // 기록에는 취소·거부가 구분되지 않는다 — 조건을 충족했는데 체결 안 됐으면 거부, 아니면 조건 미충족으로 본다
      outcome = conditionMet === true ? '거부' : '미체결';
      if (conditionMet === false && candle) {
        detail += o.side === 'SELL' && o.kind === '전량매도' ? ` — 고가 ${usd(candle.h)}가 못 미침` : ` — 종가 ${usd(candle.c)}가 조건에 못 미침`;
      }
      else if (conditionMet === true) detail += ' — 조건은 충족했지만 체결되지 않음';
    }
    return { key: o.id, title, detail, outcome, mine };
  });
}

export interface WhySegment {
  text: string;
  bold?: boolean;
}

const b = (text: string): WhySegment => ({ text, bold: true });
const p = (text: string): WhySegment => ({ text });

function fmtPct(v: number): string {
  return `${+(v * 100).toFixed(2)}%`.replace('-', '−');
}

export interface ContextInput {
  trade: TradeDto;
  start: StateSnapshot;
  levels: Levels | null;
  splits: number;
  era: TradeEra;
  candle: DayCandle | null;
  orders: OrderView[];
  /** 같은 날 체결 중 원래 leg가 둘로 합쳐진 거래인지 */
  merged: boolean;
}

/** 판단 근거 문장 — 시대별 규칙에서 자동으로 만든다 */
export function whyLines(c: ContextInput): WhySegment[][] {
  const { trade: t, start, levels, splits, era, candle, orders, merged } = c;
  const lines: WhySegment[][] = [];
  const T = start.T;
  const firstHalf = T < splits / 2;
  const tb = n(t.tBefore);
  const ta = n(t.tAfter);

  if (era === 'MIGRATED') {
    lines.push([p('노션에서 옮긴 기록이에요. 가격·T는 근사값일 수 있어 별지점은 참고용입니다.')]);
  }
  if (!levels) {
    lines.push([p('사이클 첫 매수예요. 원금을 '), b(`${splits}분할`), p('한 1회 매수금으로 시작합니다 (T '), b(`${tb} → ${ta}`), p(').')]);
    return lines;
  }
  const coef = 40 / splits;
  lines.push([
    p('그날 아침 평단 '),
    b(usd(start.avg!)),
    p(`, T=`),
    b(String(T)),
    p(`(${firstHalf ? '전반전' : '후반전'}) → 별% = (20 − ${coef === 1 ? '' : `${coef}×`}${T}) = `),
    b(fmtPct(levels.starPct)),
    p(', 별지점 '),
    b(usd(levels.star)),
    p(', 전량매도선 '),
    b(usd(levels.full)),
  ]);

  if (t.side === 'SELL') {
    const full = t.kind === '전량매도';
    if (era === 'LOC') {
      lines.push(
        full
          ? [p('전량매도선 '), b(usd(levels.full)), p('에 걸어둔 지정가가 체결 → 남은 물량을 전부 매도, T → '), b('0'), p(' (사이클 종료)')]
          : [p('종가'), ...(candle ? [p(' '), b(usd(candle.c))] : []), p('가 별지점 이상이라 '), b('쿼터매도'), p('(보유 1/4) 체결, T '), b(`${tb} → ${ta}`), p(' (×0.75)')],
      );
    } else {
      lines.push(
        full
          ? [p('판단 시각 가격 '), b(usd(n(t.price))), p('가 전량매도선 이상 → '), b('전량매도'), p(', T → '), b('0')]
          : [p('판단 시각 가격 '), b(usd(n(t.price))), p('가 별지점 이상 → '), b('쿼터매도'), p('(보유 1/4), T '), b(`${tb} → ${ta}`), p(' (×0.75)')],
      );
    }
    const left = n(t.qtyAfter);
    if (full && left > 0.0001) lines.push([p(`남은 ${left.toFixed(3)}주는 강제로 팔지 않고 다음 사이클로 이월합니다.`)]);
  } else if (era === 'LOC') {
    const filled = orders.filter((o) => o.title.startsWith('매수') && o.outcome === '체결').length;
    const refused = orders.filter((o) => o.title.startsWith('매수') && o.outcome === '거부').length;
    if (candle) {
      const close = candle.c;
      let zone: string;
      if (!firstHalf) zone = `후반전이라 종가 ${usd(close)}가 별지점(${usd(levels.star)}) 아래면 전액 매수 주문이 체결 조건`;
      else if (close < start.avg!) zone = `종가 ${usd(close)}가 평단보다 아래라 별지점·평단 두 주문 모두 체결 조건`;
      else zone = `종가 ${usd(close)}가 평단 위·별지점 아래라 별지점 주문만 체결 조건 (평단 주문은 미체결)`;
      lines.push([p(zone)]);
    }
    const parts: WhySegment[] = [p(merged ? '두 주문이 모두 체결돼 ' : `${Math.max(filled, 1)}건 체결 → `), p('T '), b(`${tb} → ${ta}`)];
    if (refused > 0) parts.push(p(` · ${refused}건은 조건을 충족했지만 거부돼 체결되지 않았어요`));
    lines.push(parts);
    const legAmount = firstHalf ? levels.oneBuy / 2 : levels.oneBuy;
    if (legAmount < n(t.price) * 0.999) {
      lines.push(
        start.cash <= 0
          ? [p('배정할 잔금이 없는데도 정수 '), b('최소 1주'), p('를 매수해 잔금이 '), b(`${usd(start.cash)} → ${usd(n(t.cashAfter))}`), p(' (엔진 설계상 정상)')]
          : [
              p(`1회 배정금 ${usd(levels.oneBuy)}${firstHalf ? '(주문당 절반)' : ''}이 1주 가격보다 작아도 정수 `),
              b('최소 1주'),
              p('를 사서 잔금이 '),
              b(`${usd(start.cash)} → ${usd(n(t.cashAfter))}`),
              p(' (엔진 설계상 정상)'),
            ],
      );
    }
  } else {
    const price = n(t.price);
    const rule = !firstHalf
      ? '후반전 → 전액 매수 (T+1)'
      : price < start.avg!
        ? '평단보다 낮아 → 전액 매수 (T+1)'
        : '평단 이상·별지점 미만 → 절반 매수 (T+0.5)';
    lines.push([p('판단 시각 가격 '), b(usd(price)), p(` ${rule}, T `), b(`${tb} → ${ta}`)]);
  }

  if (era === 'MARKET' || era === 'MIGRATED') {
    lines.push([p('이 시기는 마감 전 현재가로 판단해 시장가로 체결해서, 체결가가 일봉 종가와 다를 수 있어요.')]);
  }
  return lines;
}
