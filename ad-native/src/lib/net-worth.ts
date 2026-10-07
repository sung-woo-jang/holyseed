import type { AssetCategory } from '../types/api';
import { ASSET_CATEGORY_META } from './category-meta';
import { daysBetween } from './date';
import { pct } from './format';

export type PeriodKey = 'd30' | 'ytd' | 'y1';

export const PERIOD_LABELS: Record<PeriodKey, string> = { d30: '30일', ytd: '올해', y1: '1년' };
export const PERIOD_BASE_TEXT: Record<PeriodKey, string> = { d30: '30일 전', ytd: '작년 말', y1: '1년 전' };

export interface PeriodSnapshot {
  date: string;
  netWorth: number;
  byCategory: { category: AssetCategory; isLiability: boolean; valueKRW: number }[];
  /** valueKRW null = 그 시점엔 스냅샷이 없던 자산(신규) */
  byAsset: { assetId: string; isLiability: boolean; valueKRW: number | null }[];
}

export interface Periods {
  asOf: string;
  d30: PeriodSnapshot;
  ytd: PeriodSnapshot;
  y1: PeriodSnapshot;
}

// 백엔드 자산 카테고리 enum(REAL_ASSET/DEBT)을 프론트 키(REAL_ESTATE/LIABILITY)로 정규화
const CATEGORY_ALIAS: Record<string, string> = { REAL_ASSET: 'REAL_ESTATE', DEBT: 'LIABILITY' };
export function normalizeAssetCategory(c: string): AssetCategory {
  return (CATEGORY_ALIAS[c] ?? c) as AssetCategory;
}

export function signedValue(isLiability: boolean, value: number): number {
  return isLiability ? -value : value;
}

export function parsePeriods(raw: any): Periods | null {
  if (!raw?.d30 || !raw?.ytd || !raw?.y1) return null;
  const snap = (p: any): PeriodSnapshot => ({
    date: String(p.date ?? ''),
    netWorth: Number(p.netWorth) || 0,
    byCategory: (p.byCategory ?? []).map((c: any) => ({
      category: normalizeAssetCategory(c.category),
      isLiability: !!c.isLiability,
      valueKRW: Number(c.valueKRW) || 0,
    })),
    byAsset: (p.byAsset ?? []).map((a: any) => ({
      assetId: String(a.assetId),
      isLiability: !!a.isLiability,
      valueKRW: a.valueKRW == null ? null : Number(a.valueKRW) || 0,
    })),
  });
  return { asOf: String(raw.asOf ?? ''), d30: snap(raw.d30), ytd: snap(raw.ytd), y1: snap(raw.y1) };
}

export interface ChangeSummary {
  /** 전체 순자산 변화 (신규 편입 포함) */
  change: number;
  /** 신규 편입을 뺀 실제 증가분 — 증가율의 분자 */
  growth: number;
  /** 기준값이 0 이하면 null — 비율이 의미 없음 */
  rateText: string | null;
}

/** 증가율(%) 표기 — 3배 이상이면 +1,700% 대신 "17.6배"로 */
export function formatRate(ratePct: number | null): string | null {
  if (ratePct == null) return null;
  const multiple = 1 + ratePct / 100;
  if (multiple >= 3) return `${multiple.toFixed(1)}배`;
  return pct(ratePct);
}

/**
 * 기준 대비 증감과 비율 표기. newAssets = 기준 시점엔 기록이 없던 자산의 현재 합계 —
 * 처음 기록한 잔액은 늘어난 돈이 아니라 새로 편입된 돈이라 증가율에서 뺀다 (연도별 비교 API와 같은 기준)
 */
export function summarizeChange(base: number, now: number, newAssets = 0): ChangeSummary {
  const change = now - base;
  const growth = change - newAssets;
  if (base <= 0) return { change, growth, rateText: null };
  return { change, growth, rateText: formatRate((growth / base) * 100) };
}

export interface NewAssetSplit {
  /** 순자산 기준 합계 (부채는 음수) */
  total: number;
  byCategory: Map<AssetCategory, number>;
  names: string[];
}

/** 기준 시점엔 스냅샷이 없던 자산 — 증가율·자산군별 변화에서 따로 떼어낸다 */
export function newAssetsSince(
  assets: { id: string; name: string; category: AssetCategory; value: number; isLiability: boolean }[],
  base: PeriodSnapshot | null,
): NewAssetSplit {
  const split: NewAssetSplit = { total: 0, byCategory: new Map(), names: [] };
  if (!base) return split;
  for (const a of assets) {
    if (!assetChangeSince(a, base)?.isNew) continue;
    const v = signedValue(a.isLiability, a.value);
    split.total += v;
    split.byCategory.set(a.category, (split.byCategory.get(a.category) ?? 0) + v);
    split.names.push(a.name);
  }
  return split;
}

export interface CategoryContribution {
  category: AssetCategory;
  label: string;
  color: string;
  value: number;
}

function signedByCategory(rows: { category: string; isLiability: boolean; valueKRW: number }[]): Map<AssetCategory, number> {
  const m = new Map<AssetCategory, number>();
  for (const r of rows) {
    const key = normalizeAssetCategory(r.category);
    m.set(key, (m.get(key) ?? 0) + signedValue(r.isLiability, r.valueKRW));
  }
  return m;
}

/** 현재 자산군별 순자산 − 기준 시점 자산군별 순자산 (부채는 줄면 +). exclude = 자산군별로 빼둘 신규 편입분 */
export function categoryContributions(
  nowRows: { category: string; isLiability: boolean; valueKRW: number }[],
  baseRows: { category: string; isLiability: boolean; valueKRW: number }[],
  exclude?: Map<AssetCategory, number>,
): CategoryContribution[] {
  const now = signedByCategory(nowRows);
  const base = signedByCategory(baseRows);
  const keys = new Set<AssetCategory>([...now.keys(), ...base.keys()]);
  const out: CategoryContribution[] = [];
  for (const key of keys) {
    const value = (now.get(key) ?? 0) - (base.get(key) ?? 0) - (exclude?.get(key) ?? 0);
    if (Math.abs(value) < 1) continue;
    const meta = ASSET_CATEGORY_META[key];
    out.push({ category: key, label: meta?.label ?? key, color: meta?.color ?? '#8B95A1', value });
  }
  return out.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export interface AssetChange {
  /** 순자산에 미친 영향 (부채는 잔액이 줄면 +) */
  effect: number;
  /** 기준 시점엔 없던 자산 */
  isNew: boolean;
}

export function assetChangeSince(
  asset: { id: string; value: number; isLiability: boolean },
  base: PeriodSnapshot | null,
): AssetChange | null {
  if (!base) return null;
  const row = base.byAsset.find((a) => a.assetId === asset.id);
  if (!row) return null;
  if (row.valueKRW == null) return { effect: 0, isNew: true };
  return {
    effect: signedValue(asset.isLiability, asset.value) - signedValue(asset.isLiability, row.valueKRW),
    isNew: false,
  };
}

export const STALE_DAYS = 7;

/** 마지막 스냅샷이 minDays일 넘게 지난 자산 — 오래된 순 */
export function findStaleAssets<T extends { snapshotDate?: string }>(
  assets: T[],
  today: string,
  minDays = STALE_DAYS,
): (T & { daysAgo: number })[] {
  return assets
    .filter((a) => !!a.snapshotDate)
    .map((a) => ({ ...a, daysAgo: daysBetween(a.snapshotDate!, today) }))
    .filter((a) => a.daysAgo >= minDays)
    .sort((a, b) => b.daysAgo - a.daysAgo);
}

interface FlowTx {
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

/** (afterDate, today] 구간의 수입·지출 합계 — 아직 오지 않은 예정 거래는 제외 */
export function sumFlows(txs: FlowTx[], afterDate: string, today: string): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.date <= afterDate || t.date > today) continue;
    if (t.type === 'INCOME') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

/** 거래 기록이 기준일 이전부터 있어야 그 구간의 수입·지출 합계를 믿을 수 있다 */
export function hasFlowCoverage(txs: { date: string }[], baseDate: string): boolean {
  if (txs.length === 0) return false;
  const earliest = txs.reduce((min, t) => (t.date < min ? t.date : min), txs[0]!.date);
  return earliest <= baseDate;
}

export interface YearlyRow {
  year: number;
  /** 그해 비교 기준일 — 지난 연도는 12-31, 올해는 오늘 */
  asOf: string;
  isCurrentYear: boolean;
  netWorth: number;
  /** 작년 말 순자산 — 기록 시작 연도면 null */
  prevNetWorth: number | null;
  change: number | null;
  growth: number | null;
  /** 신규 편입을 뺀 증가율(%) — API가 계산한 값 그대로 */
  growthRate: number | null;
  newAssetsKRW: number;
  newAssets: { assetId: string; name: string; valueKRW: number; firstSnapshotDate: string }[];
  contributions: CategoryContribution[];
  staleAssets: { assetId: string; name: string; snapshotDate: string; daysBefore: number }[];
  flows: { income: number; expense: number; saved: number; other: number } | null;
}

const numOrNull = (v: any): number | null => (v == null ? null : Number(v) || 0);

/** 연도별 비교 API 응답 파싱 — 증감·증가율 계산은 서버가 하고 앱은 표시만 한다 */
export function parseYearlyComparison(raw: unknown): YearlyRow[] {
  const list: any[] = Array.isArray(raw) ? raw : [];
  return list.map((r) => ({
    year: Number(r.year),
    asOf: String(r.asOf ?? `${r.year}-12-31`),
    isCurrentYear: !!r.isCurrentYear,
    netWorth: Number(r.netWorth) || 0,
    prevNetWorth: numOrNull(r.prevNetWorth),
    change: numOrNull(r.change),
    growth: numOrNull(r.growth),
    growthRate: numOrNull(r.growthRate),
    newAssetsKRW: Number(r.newAssetsKRW) || 0,
    newAssets: (r.newAssets ?? []).map((a: any) => ({
      assetId: String(a.assetId),
      name: String(a.name ?? ''),
      valueKRW: Number(a.valueKRW) || 0,
      firstSnapshotDate: String(a.firstSnapshotDate ?? ''),
    })),
    contributions: (r.contributions ?? []).map((c: any) => {
      const key = normalizeAssetCategory(c.category);
      const meta = ASSET_CATEGORY_META[key];
      return { category: key, label: meta?.label ?? key, color: meta?.color ?? '#8B95A1', value: Number(c.valueKRW) || 0 };
    }),
    staleAssets: (r.staleAssets ?? []).map((a: any) => ({
      assetId: String(a.assetId),
      name: String(a.name ?? ''),
      snapshotDate: String(a.snapshotDate ?? ''),
      daysBefore: Number(a.daysBefore) || 0,
    })),
    flows: r.flows
      ? {
          income: Number(r.flows.income) || 0,
          expense: Number(r.flows.expense) || 0,
          saved: Number(r.flows.saved) || 0,
          other: Number(r.flows.other) || 0,
        }
      : null,
  }));
}
