import axios, { type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../lib/api';
import { LAOFUS_BASE_URL } from '../lib/laofus-api';
import { getTokens, saveTokens } from '../lib/storage';
import { todayLocal } from '../lib/date';
import type { LiveDto, StatusDto } from '../api/laofus';
import type { VrState } from '../api/vr';
import type { WorklogRecord, WorklogSummary } from '../api/worklog';

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

async function adRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const { accessToken } = await getTokens();
  if (!accessToken) throw new Error('NO_AUTH');
  const call = (token: string) => http.request({ ...config, baseURL: BASE_URL, headers: { ...config.headers, Authorization: `Bearer ${token}` } });
  try {
    return unwrap<T>((await call(accessToken)).data);
  } catch (e: any) {
    if (e?.response?.status !== 401) throw e;
    const fresh = await refreshTokens();
    if (!fresh) throw new Error('NO_AUTH');
    return unwrap<T>((await call(fresh)).data);
  }
}

async function laofusGet<T>(path: string): Promise<T> {
  const res = await http.get(path, { baseURL: LAOFUS_BASE_URL });
  return unwrap<T>(res.data);
}

// ─── 자산일기 ────────────────────────────────────────────────────────────────
export interface AssetWidgetData {
  netWorth: number;
  change30d: number | null;
  change30dPct: number | null;
  monthIncome: number;
  monthExpense: number;
  month: number;
}

export async function fetchAssetData(): Promise<AssetWidgetData> {
  const households = await adRequest<{ id: number }[]>({ method: 'get', url: '/households' });
  const hid = households[0]?.id;
  if (hid == null) throw new Error('NO_HOUSEHOLD');

  const today = todayLocal();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [dash, tx] = await Promise.all([
    adRequest<any>({ method: 'get', url: `/households/${hid}/dashboard` }),
    adRequest<{ data: { date: string; type: string; amount: number | string }[] }>({
      method: 'post',
      url: `/households/${hid}/transactions/search`,
      data: { from: monthStart, to: today, limit: 3000 },
    }),
  ]);

  const netWorth = Number(dash?.netWorth) || 0;
  const base = dash?.periods?.d30?.netWorth;
  const change30d = base != null ? netWorth - Number(base) : null;
  const change30dPct = change30d != null && Number(base) > 0 ? (change30d / Number(base)) * 100 : null;

  let monthIncome = 0;
  let monthExpense = 0;
  for (const t of Array.isArray(tx?.data) ? tx.data : []) {
    if (t.date < monthStart || t.date > today) continue;
    if (t.type === 'INCOME') monthIncome += Number(t.amount) || 0;
    else if (t.type === 'EXPENSE') monthExpense += Number(t.amount) || 0;
  }
  return { netWorth, change30d, change30dPct, monthIncome, monthExpense, month: Number(today.slice(5, 7)) };
}

// ─── 라오어(SOXL 무한매수법) ──────────────────────────────────────────────────
export interface LaofusWidgetData {
  sessionLabel: string | null;
  price: number | null;
  changePct: number | null;
  stale: boolean;
  t: number | null;
  cycleNo: number | null;
  quantity: number | null;
  avgPrice: number | null;
  profitPct: number | null;
  /** 현재가에 가장 가까운 매수·매도 주문 1건씩 */
  orders: { side: 'BUY' | 'SELL'; type: string; price: number | null; quantity: number; distancePct: number | null; alert: boolean }[];
  orderCount: number;
}

function nearestOrders(orders: LiveDto['symbols'][number]['orders']): LaofusWidgetData['orders'] {
  const pick = (side: 'BUY' | 'SELL') =>
    orders
      .filter((o) => o.side === side)
      .sort((a, b) => Math.abs(a.distancePct ?? Infinity) - Math.abs(b.distancePct ?? Infinity))[0];
  return [pick('BUY'), pick('SELL')]
    .filter((o): o is NonNullable<typeof o> => !!o)
    .map((o) => ({ side: o.side, type: o.type, price: o.price, quantity: o.quantity, distancePct: o.distancePct, alert: o.alert }));
}

export async function fetchLaofusData(): Promise<LaofusWidgetData> {
  const [live, status] = await Promise.all([laofusGet<LiveDto>('/live'), laofusGet<StatusDto>('/status').catch(() => null)]);
  const soxl = live.symbols.find((s) => s.symbol === 'SOXL');
  if (!soxl) throw new Error('NO_SYMBOL');
  const st = status?.state ?? null;
  return {
    sessionLabel: live.session?.shortLabel ?? null,
    price: soxl.price,
    changePct: soxl.changePct,
    stale: soxl.stale,
    t: st ? Number(st.t) : null,
    cycleNo: st?.cycleNo ?? null,
    quantity: soxl.quantity,
    avgPrice: soxl.avgPrice,
    profitPct: soxl.profitPct,
    orders: nearestOrders(soxl.orders),
    orderCount: soxl.orders.length,
  };
}

// ─── VR(TQQQ) ────────────────────────────────────────────────────────────────
export interface VrWidgetData {
  price: number | null;
  changePct: number | null;
  stale: boolean;
  quantity: number;
  vValue: number;
  minBand: number;
  maxBand: number;
  pool: number;
  investedPrincipal: number;
}

export async function fetchVrData(): Promise<VrWidgetData> {
  const [state, live] = await Promise.all([adRequest<VrState>({ method: 'get', url: '/vr/state' }), laofusGet<LiveDto>('/live')]);
  const tqqq = live.symbols.find((s) => s.symbol === 'TQQQ');
  return {
    price: tqqq?.price ?? null,
    changePct: tqqq?.changePct ?? null,
    stale: tqqq?.stale ?? true,
    quantity: state.quantity,
    vValue: state.vValue,
    minBand: state.minBand,
    maxBand: state.maxBand,
    pool: state.pool,
    investedPrincipal: state.investedPrincipal,
  };
}

// ─── 근무일지 ────────────────────────────────────────────────────────────────
export interface WorklogWidgetData {
  month: number;
  workDays: number;
  totalNet: number;
  receivedNet: number;
  pendingNet: number;
  today: { title: string; payStatus: string } | null;
}

export async function fetchWorklogData(): Promise<WorklogWidgetData> {
  const today = todayLocal();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const res = await adRequest<{ records: WorklogRecord[]; summary: WorklogSummary }>({ method: 'post', url: '/worklog/search', data: { year, month } });
  const todayRec = res.records.find((r) => r.workDate === today && r.payStatus !== 'DAYOFF');
  return {
    month,
    workDays: res.summary.workDays,
    totalNet: res.summary.totalNet,
    receivedNet: res.summary.receivedNet,
    pendingNet: res.summary.pendingNet,
    today: todayRec ? { title: todayRec.title, payStatus: todayRec.payStatus } : null,
  };
}

// ─── 마지막 성공값 캐시 (오프라인/일시 오류 시 이전 값을 흐리게 보여주기 위함) ─────────────
export interface Cached<T> {
  data: T;
  at: number;
}

export async function readCache<T>(name: string): Promise<Cached<T> | null> {
  try {
    const raw = await SecureStore.getItemAsync(`widget_cache_${name}`);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(name: string, data: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(`widget_cache_${name}`, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // 캐시 실패는 무시
  }
}
