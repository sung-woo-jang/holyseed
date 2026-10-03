import axios, { type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../lib/api';
import { LAOFUS_BASE_URL } from '../lib/laofus-api';
import { getStoredHouseholdId, getTokens, saveTokens } from '../lib/storage';
import { daysBetween, lastDayOfPrevMonth, shiftMonth, todayLocal } from '../lib/date';
import { getAssetCategoryMeta, resolveCategoryVisual, resolveRootCategoryId } from '../lib/category-meta';
import { levelsFor, splitsAt } from '../lib/laofus-trade-context';
import { normalizeAssetCategory } from '../lib/net-worth';
import type { CandlesDto, LiveDto, StatusDto } from '../api/laofus';
import type { VrFill, VrState } from '../api/vr';
import type { WorklogRecord } from '../api/worklog';

// 위젯은 앱 UI(스토어·내비게이션) 없이 백그라운드(headless)에서 돈다. 앱의 api 인스턴스는 401 처리 시
// 인증 스토어를 건드리므로 쓰지 않고, 토큰 저장소(SecureStore)만 공유하는 별도 클라이언트를 쓴다.
const http = axios.create({ timeout: 15000, headers: { 'Content-Type': 'application/json' } });

function unwrap<T>(body: any): T {
  return (body && typeof body === 'object' && 'success' in body && 'data' in body ? body.data : body) as T;
}

async function refreshTokens(): Promise<string | null> {
  const { refreshToken } = await getTokens();
  if (!refreshToken) return null;
  const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 15000 });
  const payload = unwrap<{ accessToken: string; refreshToken: string }>(res.data);
  await saveTokens(payload.accessToken, payload.refreshToken);
  return payload.accessToken;
}

async function adRequest<T>(config: AxiosRequestConfig, baseURL: string = BASE_URL): Promise<T> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error('NO_AUTH');
  const call = (token: string) => http.request({ ...config, baseURL, headers: { ...config.headers, Authorization: `Bearer ${token}` } });
  try {
    return unwrap<T>((await call(accessToken)).data);
  } catch (e: any) {
    if (e?.response?.status !== 401) throw e;
    const fresh = await refreshTokens();
    if (!fresh) throw new Error('NO_AUTH');
    return unwrap<T>((await call(fresh)).data);
  }
}

/** 라오어 조회도 소유자 로그인 토큰이 필요하다 — 토큰이 없으면 NO_AUTH("앱에서 로그인해 주세요") */
async function laofusGet<T>(path: string): Promise<T> {
  return adRequest<T>({ method: 'get', url: path }, LAOFUS_BASE_URL);
}

/** 앱에서 마지막으로 고른 가구(없으면 첫 번째) */
async function pickHouseholdId(households: { id: number }[]): Promise<number | undefined> {
  const stored = await getStoredHouseholdId();
  return households.find((h) => h.id === stored)?.id ?? households[0]?.id;
}

// ─── 공통 ────────────────────────────────────────────────────────────────────
function md(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

function kstParts(iso: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso));
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function kstMd(iso: string): string {
  const p = kstParts(iso);
  return `${p.month}/${p.day}`;
}

function kstHm(iso: string): string {
  const p = kstParts(iso);
  return `${p.hour}:${p.minute}`;
}

// ─── 자산일기 ────────────────────────────────────────────────────────────────
export interface AssetWidgetData {
  /** 0=이번 달, -1=지난달 … */
  offset: number;
  month: number;
  /** 이번 달: 현재 순자산 / 지난 달: 그 달 말 순자산 */
  netWorth: number;
  /** 지난 달 보기일 때 전월 말 대비 */
  monthChange: { change: number; pct: number | null } | null;
  periods: { label: string; change: number; pct: number | null }[];
  /** 자산(부채 제외) 카테고리별 비중, 큰 순 — 이번 달 보기에서만 */
  mix: { label: string; color: string; value: number }[];
  assetTotal: number;
  debtTotal: number;
  monthIncome: number;
  monthExpense: number;
  topExpense: { name: string; amount: number }[];
  recent: { date: string; title: string; amount: number; type: 'INCOME' | 'EXPENSE' }[];
  /** 월별 순자산(최근 12개월) */
  trend: number[];
  /** 마지막 자산 스냅샷 입력 후 지난 일수 */
  inputAgeDays: number | null;
}

export async function fetchAssetData(offset = 0): Promise<AssetWidgetData> {
  const households = await adRequest<{ id: number }[]>({ method: 'get', url: '/households' });
  const hid = await pickHouseholdId(households);
  if (hid == null) throw new Error('NO_HOUSEHOLD');

  const today = todayLocal();
  const ym = shiftMonth(today.slice(0, 7), offset);
  const [yy, mm] = ym.split('-').map(Number);
  const monthStart = `${ym}-01`;
  const monthEnd = offset === 0 ? today : `${ym}-${String(new Date(yy!, mm!, 0).getDate()).padStart(2, '0')}`;
  const past = offset < 0;

  const [dash, tx, assets, cats, nwEnd, nwPrev] = await Promise.all([
    adRequest<any>({ method: 'get', url: `/households/${hid}/dashboard` }),
    adRequest<{ data: any[] }>({
      method: 'post',
      url: `/households/${hid}/transactions/search`,
      data: { from: monthStart, to: monthEnd, limit: 3000 },
    }),
    adRequest<any[]>({ method: 'get', url: `/households/${hid}/assets` }).catch(() => [] as any[]),
    adRequest<any[]>({ method: 'get', url: `/households/${hid}/categories` }).catch(() => [] as any[]),
    past ? adRequest<any>({ method: 'post', url: `/households/${hid}/net-worth-at`, data: { date: monthEnd } }).catch(() => null) : Promise.resolve(null),
    past ? adRequest<any>({ method: 'post', url: `/households/${hid}/net-worth-at`, data: { date: lastDayOfPrevMonth(monthStart) } }).catch(() => null) : Promise.resolve(null),
  ]);

  const nowNet = Number(dash?.netWorth) || 0;
  const netWorth = past ? Number(nwEnd?.netWorth) || 0 : nowNet;
  let monthChange: AssetWidgetData['monthChange'] = null;
  if (past && nwEnd && nwPrev) {
    const base = Number(nwPrev.netWorth) || 0;
    monthChange = { change: netWorth - base, pct: base > 0 ? ((netWorth - base) / base) * 100 : null };
  }

  const periods = past
    ? []
    : (
        [
          ['30일', dash?.periods?.d30],
          ['올해', dash?.periods?.ytd],
          ['1년', dash?.periods?.y1],
        ] as const
      )
        .filter(([, p]) => p?.netWorth != null)
        .map(([label, p]) => {
          const base = Number(p.netWorth);
          return { label, change: nowNet - base, pct: base > 0 ? ((nowNet - base) / base) * 100 : null };
        });

  const byCat = new Map<string, number>();
  let debtTotal = 0;
  for (const d of (dash?.donut ?? []) as { category: string; isLiability: boolean; valueKRW: number }[]) {
    const v = Number(d.valueKRW) || 0;
    if (d.isLiability) debtTotal += v;
    else byCat.set(d.category, (byCat.get(d.category) ?? 0) + v);
  }
  const mix = past
    ? []
    : [...byCat.entries()]
        .map(([category, value]) => {
          const meta = getAssetCategoryMeta(normalizeAssetCategory(category));
          return { label: meta.label, color: meta.color, value };
        })
        .filter((m) => m.value > 0)
        .sort((a, b) => b.value - a.value);
  const assetTotal = mix.reduce((a, m) => a + m.value, 0);

  const catName = new Map<number, string>((Array.isArray(cats) ? cats : []).map((c: any) => [c.id, c.name]));
  let monthIncome = 0;
  let monthExpense = 0;
  const byExpense = new Map<string, number>();
  const rows: { id: number; date: string; title: string; amount: number; type: 'INCOME' | 'EXPENSE' }[] = [];
  for (const t of Array.isArray(tx?.data) ? tx.data : []) {
    if (t.date < monthStart || t.date > monthEnd) continue;
    const amount = Number(t.amount) || 0;
    if (t.type === 'INCOME') monthIncome += amount;
    else if (t.type === 'EXPENSE') {
      monthExpense += amount;
      const name = catName.get(t.categoryId) ?? '기타';
      byExpense.set(name, (byExpense.get(name) ?? 0) + amount);
    } else continue;
    rows.push({ id: t.id, date: t.date, title: t.title || t.memo || catName.get(t.categoryId) || '거래', amount, type: t.type });
  }
  rows.sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));
  const recent = rows.slice(0, 8).map((r) => ({ date: md(r.date), title: r.title, amount: r.amount, type: r.type }));
  const topExpense = [...byExpense.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const lastInput = (Array.isArray(assets) ? assets : []).reduce<string | null>((max, a: any) => {
    const d = a?.latestSnapshot?.date as string | undefined;
    return d && (!max || d > max) ? d : max;
  }, null);

  const trend = ((dash?.timeseries ?? []) as { month: string; netWorth: number }[]).slice(-12).map((t) => Number(t.netWorth) || 0);

  return {
    offset,
    month: mm!,
    netWorth,
    monthChange,
    periods,
    mix,
    assetTotal,
    debtTotal,
    monthIncome,
    monthExpense,
    topExpense,
    recent,
    trend,
    inputAgeDays: lastInput ? daysBetween(lastInput, today) : null,
  };
}

// ─── 거래장부 ────────────────────────────────────────────────────────────────
export interface LedgerWidgetData {
  offset: number;
  year: number;
  month: number;
  today: string;
  income: number;
  expense: number;
  /** 일별 합계 */
  days: { d: number; exp: number; inc: number }[];
  /** 지출 대분류 상위 */
  topCats: { name: string; color: string; amount: number }[];
  /** 이 달 거래(최신순, 최대 150건) — 날짜 선택 시 해당 날 목록을 여기서 고른다 */
  txs: { date: string; title: string; cat: string; color: string; amount: number; type: 'INCOME' | 'EXPENSE' }[];
}

export async function fetchLedgerData(offset = 0): Promise<LedgerWidgetData> {
  const households = await adRequest<{ id: number }[]>({ method: 'get', url: '/households' });
  const hid = await pickHouseholdId(households);
  if (hid == null) throw new Error('NO_HOUSEHOLD');

  const today = todayLocal();
  const ym = shiftMonth(today.slice(0, 7), offset);
  const [yy, mm] = ym.split('-').map(Number);
  const monthStart = `${ym}-01`;
  const monthEnd = `${ym}-${String(new Date(yy!, mm!, 0).getDate()).padStart(2, '0')}`;

  const [tx, cats] = await Promise.all([
    adRequest<{ data: any[] }>({ method: 'post', url: `/households/${hid}/transactions/search`, data: { from: monthStart, to: monthEnd, limit: 3000 } }),
    adRequest<any[]>({ method: 'get', url: `/households/${hid}/categories` }).catch(() => [] as any[]),
  ]);
  const categories = (Array.isArray(cats) ? cats : []) as any[];
  const nameOf = new Map<number, string>(categories.map((c) => [c.id, c.name]));

  let income = 0;
  let expense = 0;
  const byDay = new Map<number, { exp: number; inc: number }>();
  const byCat = new Map<string, { color: string; amount: number }>();
  const rows: (LedgerWidgetData['txs'][number] & { id: number })[] = [];
  for (const t of Array.isArray(tx?.data) ? tx.data : []) {
    if (t.date < monthStart || t.date > monthEnd) continue;
    if (t.type !== 'INCOME' && t.type !== 'EXPENSE') continue;
    const amount = Number(t.amount) || 0;
    const day = byDay.get(Number(t.date.slice(8, 10))) ?? { exp: 0, inc: 0 };
    const catName = nameOf.get(t.categoryId) ?? '기타';
    const visual = resolveCategoryVisual(t.categoryId, catName, categories);
    if (t.type === 'INCOME') {
      income += amount;
      day.inc += amount;
    } else {
      expense += amount;
      day.exp += amount;
      const rootId = resolveRootCategoryId(t.categoryId, categories);
      const rootName = (rootId != null ? nameOf.get(rootId) : undefined) ?? catName;
      const cur = byCat.get(rootName) ?? { color: resolveCategoryVisual(rootId, rootName, categories).color, amount: 0 };
      cur.amount += amount;
      byCat.set(rootName, cur);
    }
    byDay.set(Number(t.date.slice(8, 10)), day);
    rows.push({ id: t.id, date: t.date, title: t.title || t.memo || catName, cat: catName, color: visual.color, amount, type: t.type });
  }
  rows.sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));

  return {
    offset,
    year: yy!,
    month: mm!,
    today,
    income,
    expense,
    days: [...byDay.entries()].map(([d, v]) => ({ d, ...v })),
    topCats: [...byCat.entries()]
      .map(([name, v]) => ({ name, color: v.color, amount: v.amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4),
    txs: rows.slice(0, 150).map(({ id: _id, ...r }) => r),
  };
}

// ─── 라오어(SOXL 무한매수법) ──────────────────────────────────────────────────
export interface LaofusWidgetData {
  sessionLabel: string | null;
  price: number | null;
  changePct: number | null;
  stale: boolean;
  t: number | null;
  splits: number;
  cycleNo: number | null;
  cycleDay: number | null;
  quantity: number | null;
  avgPrice: number | null;
  profitPct: number | null;
  marketValueUsd: number | null;
  profitUsd: number | null;
  cashUsd: number | null;
  star: number | null;
  buyStar: number | null;
  target: number | null;
  oneBuy: number | null;
  totalAssetsKrw: number | null;
  dayProfitUsd: number | null;
  /** 현재가에서 가까운 순 */
  orders: { side: 'BUY' | 'SELL'; type: string; price: number | null; quantity: number; distancePct: number | null; alert: boolean }[];
  trades: { date: string; side: string; kind: string; price: number; quantity: number }[];
  nextRun: string | null;
  /** 최근 한 달 종가(오래된 순) */
  closes: number[];
}

export async function fetchLaofusData(): Promise<LaofusWidgetData> {
  const [live, status, candles] = await Promise.all([
    laofusGet<LiveDto>('/live'),
    laofusGet<StatusDto>('/status').catch(() => null),
    laofusGet<CandlesDto>('/candles?range=1m').catch(() => null),
  ]);
  const soxl = live.symbols.find((s) => s.symbol === 'SOXL');
  if (!soxl) throw new Error('NO_SYMBOL');
  const st = status?.state ?? null;
  const today = todayLocal();
  const splits = splitsAt(today);

  const t = st ? Number(st.t) : null;
  const avg = st && Number(st.quantity) > 0 ? Number(st.avgPrice) : null;
  const levels = st && t !== null ? levelsFor({ T: t, quantity: Number(st.quantity), avg, cash: Number(st.cash) }, splits) : null;

  const cycle = st ? status?.cycles.find((c) => c.cycleNo === st.cycleNo) ?? null : null;
  const trades = (cycle?.trades ?? [])
    .filter((x) => x.kind !== '이월')
    .slice(-4)
    .reverse()
    .map((x) => ({ date: kstMd(x.date), side: x.side, kind: x.kind, price: Number(x.price), quantity: Number(x.quantity) }));

  const next = status?.engine.nextRuns?.[0] ?? null;
  const orders = [...soxl.orders]
    .sort((a, b) => Math.abs(a.distancePct ?? Infinity) - Math.abs(b.distancePct ?? Infinity))
    .map((o) => ({ side: o.side, type: o.type, price: o.price, quantity: o.quantity, distancePct: o.distancePct, alert: o.alert }));

  return {
    sessionLabel: live.session?.shortLabel ?? null,
    price: soxl.price,
    changePct: soxl.changePct,
    stale: soxl.stale,
    t,
    splits,
    cycleNo: st?.cycleNo ?? null,
    cycleDay: cycle ? daysBetween(cycle.startDate.slice(0, 10), today) + 1 : null,
    quantity: soxl.quantity,
    avgPrice: soxl.avgPrice,
    profitPct: soxl.profitPct,
    marketValueUsd: soxl.marketValueUsd,
    profitUsd: soxl.marketValueUsd !== null && soxl.quantity !== null && soxl.avgPrice !== null ? soxl.marketValueUsd - soxl.quantity * soxl.avgPrice : null,
    cashUsd: st ? Number(st.cash) : null,
    star: levels?.star ?? null,
    buyStar: levels?.buyStar ?? null,
    target: levels?.full ?? null,
    oneBuy: levels?.oneBuy ?? null,
    totalAssetsKrw: live.totals?.totalAssetsKrw ?? null,
    dayProfitUsd: live.totals?.dayProfitUsd ?? null,
    orders,
    trades,
    nextRun: next ? `${kstMd(next.at)} ${kstHm(next.at)}` : null,
    closes: (candles?.candles ?? []).map((c) => Number(c.closePrice)).filter((v) => v > 0).reverse().slice(-24),
  };
}

// ─── VR(TQQQ) ────────────────────────────────────────────────────────────────
export interface VrWidgetData {
  price: number | null;
  changePct: number | null;
  stale: boolean;
  quantity: number;
  avgPrice: number;
  vValue: number;
  v2Preview: number | null;
  minBand: number;
  maxBand: number;
  pool: number;
  usablePool: number;
  investedPrincipal: number;
  cycleNo: number | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  renewalInDays: number | null;
  fills: { date: string; kind: string; price: number; quantity: number }[];
  /** 계좌총액(Pool+평가금)과 누적 원금 추이 */
  wealth: { date: string; total: number; principal: number }[];
}

export async function fetchVrData(): Promise<VrWidgetData> {
  const [state, live, fills, wealth] = await Promise.all([
    adRequest<VrState>({ method: 'get', url: '/vr/state' }),
    laofusGet<LiveDto>('/live'),
    adRequest<VrFill[]>({ method: 'get', url: '/vr/fills' }).catch(() => [] as VrFill[]),
    adRequest<{ date: string; totalAssets: number; cumulativePrincipal: number }[]>({ method: 'get', url: '/vr/wealth-history' }).catch(() => []),
  ]);
  const tqqq = live.symbols.find((s) => s.symbol === 'TQQQ');
  const today = todayLocal();
  const recent = [...fills]
    .sort((a, b) => (a.fillDate === b.fillDate ? b.id - a.id : a.fillDate < b.fillDate ? 1 : -1))
    .filter((f) => f.kind !== 'DEPOSIT')
    .slice(0, 4)
    .map((f) => ({ date: md(f.fillDate), kind: f.kind, price: f.price, quantity: f.quantity }));
  return {
    price: tqqq?.price ?? null,
    changePct: tqqq?.changePct ?? null,
    stale: tqqq?.stale ?? true,
    quantity: state.quantity,
    avgPrice: state.avgPrice,
    vValue: state.vValue,
    v2Preview: state.v2Preview,
    minBand: state.minBand,
    maxBand: state.maxBand,
    pool: state.pool,
    usablePool: state.usablePool,
    investedPrincipal: state.investedPrincipal,
    cycleNo: state.cycle?.cycleNo ?? null,
    cycleStart: state.cycle ? md(state.cycle.startDate) : null,
    cycleEnd: state.cycle?.endDate ? md(state.cycle.endDate) : null,
    renewalInDays: state.nextRenewalDate ? daysBetween(today, state.nextRenewalDate) : null,
    fills: recent,
    wealth: wealth.slice(-30).map((w) => ({ date: md(w.date), total: Number(w.totalAssets) || 0, principal: Number(w.cumulativePrincipal) || 0 })),
  };
}

// ─── 근무일지 ────────────────────────────────────────────────────────────────
export interface WorklogWidgetData {
  offset: number;
  year: number;
  month: number;
  today: string;
  workDays: number;
  laborUnits: number;
  totalNet: number;
  totalGross: number;
  receivedNet: number;
  pendingNet: number;
  /** 전월 실수령 합계 (비교용) */
  prevNet: number | null;
  /** 달력 표시용: W=근무(수령/예정/미수령) S=근무예정 O=휴무 */
  days: { d: number; s: 'W' | 'S' | 'O' }[];
  todayTitle: string | null;
  next: { date: string; title: string } | null;
  receivables: { date: string; title: string; net: number }[];
  /** 이 달 근무 기록(최신순) */
  records: { date: string; title: string; net: number }[];
}

function workSummary(records: WorklogRecord[]) {
  const work = records.filter((r) => r.payStatus !== 'DAYOFF');
  const sum = (list: WorklogRecord[], f: (r: WorklogRecord) => number) => list.reduce((a, r) => a + f(r), 0);
  return { work, sum };
}

export async function fetchWorklogData(offset = 0): Promise<WorklogWidgetData> {
  const today = todayLocal();
  const ym = shiftMonth(today.slice(0, 7), offset);
  const prev = shiftMonth(ym, -1);
  const year = Number(ym.slice(0, 4));
  const month = Number(ym.slice(5, 7));
  const [res, prevRes] = await Promise.all([
    adRequest<{ records: WorklogRecord[] }>({ method: 'post', url: '/worklog/search', data: { year, month } }),
    adRequest<{ records: WorklogRecord[] }>({ method: 'post', url: '/worklog/search', data: { year: Number(prev.slice(0, 4)), month: Number(prev.slice(5, 7)) } }).catch(() => null),
  ]);

  const { work, sum } = workSummary(res.records);
  const pending = work.filter((r) => r.payStatus === 'EXPECTED' || r.payStatus === 'UNPAID');
  const prevWork = prevRes ? workSummary(prevRes.records) : null;

  const days = res.records.map((r) => ({
    d: Number(r.workDate.slice(8, 10)),
    s: (r.payStatus === 'DAYOFF' ? 'O' : r.payStatus === 'SCHEDULED' ? 'S' : 'W') as 'W' | 'S' | 'O',
  }));
  const todayRec = offset === 0 ? work.find((r) => r.workDate === today) : undefined;
  const nextRec =
    offset === 0
      ? work.filter((r) => r.workDate > today).sort((a, b) => (a.workDate < b.workDate ? -1 : 1))[0]
      : undefined;

  return {
    offset,
    year,
    month,
    today,
    workDays: work.length,
    laborUnits: sum(work, (r) => r.payMultiplier),
    totalNet: sum(work, (r) => r.netAmount),
    totalGross: sum(work, (r) => r.effectiveAmount),
    receivedNet: sum(work.filter((r) => r.payStatus === 'RECEIVED'), (r) => r.netAmount),
    pendingNet: sum(pending, (r) => r.netAmount),
    prevNet: prevWork ? prevWork.sum(prevWork.work, (r) => r.netAmount) : null,
    days,
    todayTitle: todayRec ? todayRec.title : null,
    next: nextRec ? { date: md(nextRec.workDate), title: nextRec.title } : null,
    receivables: [...pending]
      .sort((a, b) => (a.workDate < b.workDate ? -1 : 1))
      .slice(0, 4)
      .map((r) => ({ date: md(r.workDate), title: r.title, net: r.netAmount })),
    records: [...work]
      .sort((a, b) => (a.workDate < b.workDate ? 1 : -1))
      .slice(0, 8)
      .map((r) => ({ date: md(r.workDate), title: r.title, net: r.netAmount })),
  };
}

// ─── 마지막 성공값 캐시 (오프라인/일시 오류 시 이전 값을 흐리게 보여주기 위함) ─────────────
export interface Cached<T> {
  data: T;
  at: number;
}

export async function readCache<T>(name: string): Promise<Cached<T> | null> {
  try {
    const raw = await SecureStore.getItemAsync(`widget_cache_v3_${name}`);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(name: string, data: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(`widget_cache_v3_${name}`, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // 캐시 실패는 무시
  }
}
