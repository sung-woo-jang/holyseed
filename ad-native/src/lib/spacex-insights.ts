import type { SpacexCandleDto, SpacexEntryDto, SpacexLatestOrderDto } from '../api/spacex';
import { daysBetween, shiftDay } from './date';

const WEEKDAYS = '일월화수목금토';

/** 'YYYY-MM-DD'의 요일 한 글자 (일~토) */
export function weekdayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return WEEKDAYS[new Date(y!, m! - 1, d!).getDay()]!;
}

/** 'YYYY-MM-DD'의 요일 번호 (0=일 … 6=토) */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y!, m! - 1, d!).getDay();
}

export interface BuyEntry {
  date: string;
  amount: number;
  price: number;
  quantity: number;
}

/** 체결가·수량이 있는 매수 기록만, 날짜 오름차순 (리밸런싱·가격 미기록은 평단 계산에서 제외) */
export function buyEntries(entries: SpacexEntryDto[]): BuyEntry[] {
  return entries
    .filter((e) => !e.isRebalance && e.price !== null && e.quantity !== null && Number(e.quantity) > 0 && e.amount > 0)
    .map((e) => ({ date: e.date, amount: Number(e.amount), price: Number(e.price), quantity: Number(e.quantity) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface BuyStats {
  buyCount: number;
  quantity: number;
  principal: number;
  avgPrice: number;
  value: number;
  profit: number;
  profitPct: number;
  /** 현재가가 평단보다 얼마나 위/아래인지(%) */
  vsAvgPct: number;
  /** 손익분기(평단)가 현재가보다 얼마나 위/아래인지(%) — 현재가에서 몇 % 움직이면 본전인지 */
  breakEvenGapPct: number;
  minBuy: { price: number; date: string };
  maxBuy: { price: number; date: string };
  /** 하루 한 번씩 같은 금액이 아니어도 단순 평균(가격 평균) */
  simpleAvgPrice: number;
}

export function computeStats(buys: BuyEntry[], currentPrice: number): BuyStats | null {
  if (buys.length === 0 || !(currentPrice > 0)) return null;
  const quantity = buys.reduce((s, b) => s + b.quantity, 0);
  const principal = buys.reduce((s, b) => s + b.amount, 0);
  const avgPrice = buys.reduce((s, b) => s + b.price * b.quantity, 0) / quantity;
  const value = quantity * currentPrice;
  const profit = value - principal;
  const min = buys.reduce((m, b) => (b.price < m.price ? b : m));
  const max = buys.reduce((m, b) => (b.price > m.price ? b : m));
  return {
    buyCount: buys.length,
    quantity,
    principal,
    avgPrice,
    value,
    profit,
    profitPct: (profit / principal) * 100,
    vsAvgPct: (currentPrice / avgPrice - 1) * 100,
    breakEvenGapPct: (avgPrice / currentPrice - 1) * 100,
    minBuy: { price: min.price, date: min.date },
    maxBuy: { price: max.price, date: max.date },
    simpleAvgPrice: buys.reduce((s, b) => s + b.price, 0) / buys.length,
  };
}

export interface LumpSumCompare {
  /** 첫 매수일에 같은 돈을 한 번에 샀다면 지금 평가금 */
  lumpValue: number;
  lumpPct: number;
  /** 실제(분할 매수) 평가금과의 차이 = 실제 − 한 번에 */
  advantage: number;
  firstDate: string;
}

export function compareLumpSum(buys: BuyEntry[], currentPrice: number): LumpSumCompare | null {
  if (buys.length < 2 || !(currentPrice > 0)) return null;
  const principal = buys.reduce((s, b) => s + b.amount, 0);
  const quantity = buys.reduce((s, b) => s + b.quantity, 0);
  const lumpValue = (principal / buys[0]!.price) * currentPrice;
  return {
    lumpValue,
    lumpPct: (lumpValue / principal - 1) * 100,
    advantage: quantity * currentPrice - lumpValue,
    firstDate: buys[0]!.date,
  };
}

export interface Scenario {
  pct: number;
  price: number;
  value: number;
  /** 원금 대비 수익률(%) */
  returnPct: number;
}

export function buildScenarios(quantity: number, principal: number, currentPrice: number, pcts: number[] = [-20, -10, -5, 0, 5, 10, 20]): Scenario[] {
  return pcts.map((pct) => {
    const price = currentPrice * (1 + pct / 100);
    const value = quantity * price;
    return { pct, price, value, returnPct: (value / principal - 1) * 100 };
  });
}

/** 하루 금액을 일정하게 계속 넣을 때의 원금 */
export function projectPrincipal(principal: number, dailyAmount: number, tradingDays: number): number {
  return principal + dailyAmount * tradingDays;
}

/** 매수 금액들의 대표값(센트 단위 반올림한 중앙값) — "매일 $2" 같은 일정 금액 추정 */
export function typicalDailyAmount(buys: BuyEntry[]): number | null {
  if (buys.length === 0) return null;
  const sorted = buys.map((b) => b.amount).sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)]!;
  return Math.round(mid * 100) / 100;
}

export type CalendarState = 'pre' | 'buy' | 'missed' | 'pending' | 'today' | 'upcoming' | 'closed';

export interface CalendarDay {
  date: string;
  day: number;
  state: CalendarState;
}

export interface CalendarWeek {
  /** 그 주 월요일 YYYY-MM-DD */
  monday: string;
  days: CalendarDay[];
}

export interface CalendarResult {
  weeks: CalendarWeek[];
  /** 마지막 매수일 기준 거슬러 올라가는 연속 매수 거래일 수 */
  streak: number;
  /** 시작일 이후 어제까지, 거래일인데 매수 기록이 없는 날 */
  missedDays: string[];
}

function mondayOf(date: string): string {
  const idx = weekdayIndex(date);
  return shiftDay(date, idx === 0 ? -6 : 1 - idx);
}

/**
 * 월~금 주간 매수 캘린더.
 * - 거래일은 일봉 날짜로 판단(휴장일은 일봉이 없음) → 평일인데 일봉이 없으면 'closed'
 * - 시작일 이전은 'pre', 오늘 이후는 'upcoming', 오늘은 접수됐으면 'pending'/체결 'buy', 아니면 'today'
 */
export function buildCalendar(params: {
  buyDates: string[];
  tradingDates: string[];
  startDate: string | null;
  today: string;
  latestOrder: SpacexLatestOrderDto | null;
  weeks?: number;
}): CalendarResult {
  const { buyDates, tradingDates, startDate, today, latestOrder, weeks = 3 } = params;
  const buySet = new Set(buyDates);
  const tradingSet = new Set(tradingDates);
  const orderDate = latestOrder ? latestOrder.orderedAt.slice(0, 10) : null;
  const orderIsToday = orderDate === today;

  const thisMonday = mondayOf(today);
  const firstMonday = shiftDay(thisMonday, -7 * (weeks - 1));

  const result: CalendarWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const monday = shiftDay(firstMonday, 7 * w);
    const days: CalendarDay[] = [];
    for (let i = 0; i < 5; i++) {
      const date = shiftDay(monday, i);
      let state: CalendarState;
      if (startDate && date < startDate) state = 'pre';
      else if (buySet.has(date)) state = 'buy';
      else if (date > today) state = 'upcoming';
      else if (date === today) {
        if (orderIsToday && latestOrder?.status === 'PENDING') state = 'pending';
        else if (orderIsToday && latestOrder?.status === 'FILLED') state = 'buy';
        else state = 'today';
      } else state = tradingSet.has(date) ? 'missed' : 'closed';
      days.push({ date, day: Number(date.slice(8, 10)), state });
    }
    result.push({ monday, days });
  }

  // 시작일 이후 어제까지 빠진 거래일 / 연속 매수
  const missedDays: string[] = [];
  let streak = 0;
  if (startDate) {
    const span = daysBetween(startDate, today);
    const bought = (d: string) => buySet.has(d);
    for (let i = 0; i < span; i++) {
      const date = shiftDay(startDate, i);
      if (weekdayIndex(date) === 0 || weekdayIndex(date) === 6) continue;
      if (tradingSet.has(date) && !bought(date)) missedDays.push(date);
    }
    // 오늘(체결 대기 포함)을 빼고, 어제부터 거슬러 올라가며 거래일 연속 매수를 센다
    for (let i = 1; i <= span; i++) {
      const date = shiftDay(today, -i);
      if (date < startDate) break;
      if (!tradingSet.has(date)) continue;
      if (!bought(date)) break;
      streak++;
    }
    if (orderIsToday && latestOrder?.status === 'FILLED' && !bought(today)) streak++;
    if (bought(today)) streak++;
  }
  return { weeks: result, streak, missedDays };
}

export interface TodayCardModel {
  title: string;
  pill: { text: string; tone: 'warn' | 'ok' | 'muted' };
  big: string;
  sub: string | null;
}

function hhmm(iso: string): string {
  return iso.slice(11, 16);
}

/** "오늘의 매수" 카드 문구 — 토스 주문 상태(latestOrder)와 오늘 날짜(KST 'YYYY-MM-DD')로 결정 */
export function buildTodayCard(params: {
  latestOrder: SpacexLatestOrderDto | null;
  today: string;
  formatUsd: (v: number, d?: number) => string;
}): TodayCardModel {
  const { latestOrder: o, today, formatUsd } = params;
  const orderDate = o ? o.orderedAt.slice(0, 10) : null;
  const isToday = orderDate === today;
  const qtyText = (q: number | null) => (q !== null ? `${q}주` : '');

  if (o && isToday) {
    if (o.status === 'PENDING') {
      return {
        title: '오늘의 매수',
        pill: { text: '체결 대기', tone: 'warn' },
        big: `${o.amount !== null ? `${formatUsd(o.amount)} 시장가 매수` : '시장가 매수'}${o.quantity !== null ? ` · 약 ${qtyText(o.quantity)}` : ''}`,
        sub: `${hhmm(o.orderedAt)} 접수 · 체결되면 기록에 자동 반영돼요`,
      };
    }
    if (o.status === 'FILLED') {
      const avg = o.avgPrice !== null ? ` @ ${formatUsd(o.avgPrice)}` : '';
      return {
        title: '오늘의 매수',
        pill: { text: '체결 완료', tone: 'ok' },
        big: `${o.amount !== null ? `${formatUsd(o.amount)} 체결` : '체결'} · ${qtyText(o.quantity)}${avg}`,
        sub: o.recorded ? '기록에 반영됐어요' : '기록 반영은 내일 오전 9시 10분에 자동으로 돼요',
      };
    }
    return { title: '오늘의 매수', pill: { text: '취소됨', tone: 'muted' }, big: '오늘 주문이 취소됐어요', sub: null };
  }

  // 어제 체결됐지만 아직 기록(다음날 09:10 동기화)에 안 들어온 경우
  if (o && o.status === 'FILLED' && !o.recorded) {
    const avg = o.avgPrice !== null ? ` @ ${formatUsd(o.avgPrice)}` : '';
    return {
      title: '최근 매수',
      pill: { text: '체결 완료', tone: 'ok' },
      big: `${o.amount !== null ? `${formatUsd(o.amount)} 체결` : '체결'} · ${qtyText(o.quantity)}${avg}`,
      sub: `${Number(orderDate!.slice(5, 7))}. ${Number(orderDate!.slice(8, 10))}. 주문 · 기록 반영 전이에요`,
    };
  }

  const wd = weekdayIndex(today);
  if (wd === 0 || wd === 6) {
    return { title: '오늘의 매수', pill: { text: '휴장', tone: 'muted' }, big: '오늘은 휴장일이에요', sub: null };
  }
  return {
    title: '오늘의 매수',
    pill: { text: '접수 전', tone: 'muted' },
    big: '아직 오늘 주문이 접수되지 않았어요',
    sub: '최근에는 밤 9시대에 접수됐어요',
  };
}

export interface ChartPoint {
  date: string;
  close: number;
}

/** 일봉 종가 시리즈 — 오늘(마지막) 봉은 실시간 가격으로 덮어쓴다. 오늘 봉이 아직 없으면 붙인다 */
export function chartSeries(candles: SpacexCandleDto[], livePrice: number | null, today: string): ChartPoint[] {
  const pts = candles.map((c) => ({ date: c.date, close: c.close }));
  if (livePrice === null || pts.length === 0) return pts;
  const last = pts[pts.length - 1]!;
  if (last.date === today) last.close = livePrice;
  else if (last.date < today && weekdayIndex(today) !== 0 && weekdayIndex(today) !== 6) pts.push({ date: today, close: livePrice });
  return pts;
}
