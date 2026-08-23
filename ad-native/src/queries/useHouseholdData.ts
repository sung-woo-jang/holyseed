import { useQuery } from '@tanstack/react-query';
import { dashboardApi, assetsApi, txApi, recurringApi, householdsApi, categoriesApi } from '../api';
import { useAuthStore } from '../stores/auth.store';
import type { AssetCategory, Category, MemberRole } from '../types/api';
import { ASSET_CATEGORY_META } from '../lib/category-meta';
import { qk } from './keys';
import { toLocalDateString } from '../lib/date';

export interface HouseholdAsset {
  id: string;
  name: string;
  category: AssetCategory;
  currency: string;
  currencyValue?: number;
  fxRate?: number;
  value: number;
  isLiability: boolean;
  ownerUserId?: number | null;
  delta: number | null;
  deltaPct: number | null;
  snapshotDate?: string;
}

export interface HouseholdTransaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  categoryId: number | null;
  title: string;
  rawTitle?: string;
  memo?: string;
  from?: string;
  to?: string;
  auto?: boolean;
}

export interface HouseholdRecurring {
  id: string;
  title: string;
  amount: number;
  category: string;
  categoryId: number | null;
  dayOfMonth: number;
  from: string;
  active: boolean;
  nextDate: string;
  type: 'INCOME' | 'EXPENSE';
  startDate?: string;
  endDate?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: MemberRole;
  avatar: string;
  initial: string;
}

export interface HouseholdData {
  netWorth: {
    current: number;
    lastYear: number;
    snapshotDate: string;
    monthlyHistory: { date: string; value: number }[];
  };
  contributions: { category: string; value: number; color: string }[];
  assets: HouseholdAsset[];
  transactions: HouseholdTransaction[];
  recurring: HouseholdRecurring[];
  members: HouseholdMember[];
  pendingInvites: { id: string; code: string; role: MemberRole; household: string; expiresAt: string }[];
  categories: Category[];
  isLoading: boolean;
}

const EMPTY: HouseholdData = {
  netWorth: { current: 0, lastYear: 0, snapshotDate: '—', monthlyHistory: [] },
  contributions: [],
  assets: [],
  transactions: [],
  recurring: [],
  members: [],
  pendingInvites: [],
  categories: [],
  isLoading: false,
};

// 백엔드 자산 카테고리 enum(REAL_ASSET/DEBT)을 프론트 키(REAL_ESTATE/LIABILITY)로 정규화
const CATEGORY_ALIAS: Record<string, string> = {
  REAL_ASSET: 'REAL_ESTATE',
  DEBT: 'LIABILITY',
};
function normalizeAssetCategory(c: string): AssetCategory {
  return (CATEGORY_ALIAS[c] ?? c) as AssetCategory;
}

const CATEGORY_LABEL: Record<string, string> = {
  CASH:        ASSET_CATEGORY_META.CASH.label,
  INVESTMENT:  ASSET_CATEGORY_META.INVESTMENT.label,
  CRYPTO:      ASSET_CATEGORY_META.CRYPTO.label,
  REAL_ESTATE: ASSET_CATEGORY_META.REAL_ESTATE.label,
  PENSION:     ASSET_CATEGORY_META.PENSION.label,
  LIABILITY:   ASSET_CATEGORY_META.LIABILITY.label,
};

const CATEGORY_COLOR: Record<string, string> = {
  CASH: '#0AB39C',
  INVESTMENT: '#3182F6',
  CRYPTO: '#A78BFA',
  REAL_ESTATE: '#F59E0B',
  PENSION: '#EC4899',
  LIABILITY: '#94A3B8',
};

function computeNextDate(dayOfMonth: number): string {
  const today = new Date();
  const candidate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (candidate <= today) candidate.setMonth(candidate.getMonth() + 1);
  return toLocalDateString(candidate);
}

export function useHouseholdData(): HouseholdData {
  const currentHousehold = useAuthStore((s) => s.currentHousehold);
  const hid = currentHousehold?.id;
  const enabled = !!hid;

  const dashQ = useQuery({
    queryKey: qk.dashboard(hid ?? 0),
    queryFn: () => dashboardApi.get(hid!),
    enabled,
    staleTime: 30_000,
  });

  const assetsQ = useQuery({
    queryKey: qk.assets(hid ?? 0),
    queryFn: () => assetsApi.list(hid!),
    enabled,
    staleTime: 30_000,
  });

  const txQ = useQuery({
    queryKey: qk.transactions(hid ?? 0),
    queryFn: () => txApi.search(hid!, { limit: 300 }),
    enabled,
    staleTime: 30_000,
  });

  const recurringQ = useQuery({
    queryKey: qk.recurring(hid ?? 0),
    queryFn: () => recurringApi.list(hid!),
    enabled,
    staleTime: 60_000,
  });

  const membersQ = useQuery({
    queryKey: qk.members(hid ?? 0),
    queryFn: () => householdsApi.members(hid!),
    enabled,
    staleTime: 60_000,
  });

  const invitationsQ = useQuery({
    queryKey: qk.invitations(hid ?? 0),
    queryFn: () => householdsApi.invitations(hid!),
    enabled,
    staleTime: 60_000,
  });

  const categoriesQ = useQuery({
    queryKey: qk.categories(hid ?? 0),
    queryFn: () => categoriesApi.list(hid!),
    enabled,
    staleTime: 300_000,
  });

  if (!hid) return EMPTY;

  const isLoading = assetsQ.isLoading || membersQ.isLoading;

  const dash = dashQ.data as any;
  const rawAssets: any[] = Array.isArray(assetsQ.data) ? assetsQ.data : [];
  const rawTx: any[] = Array.isArray(txQ.data) ? txQ.data : ((txQ.data as any)?.data ?? []);
  const rawRecurring: any[] = Array.isArray(recurringQ.data) ? recurringQ.data : [];
  const rawMembers: any[] = Array.isArray(membersQ.data) ? membersQ.data : [];
  const rawInvitations: any[] = Array.isArray(invitationsQ.data) ? invitationsQ.data : [];
  const rawCategories: any[] = Array.isArray(categoriesQ.data) ? categoriesQ.data : [];

  // 순자산 시계열
  const timeseries: { month: string; netWorth: number }[] = dash?.timeseries ?? [];
  const monthlyHistory = timeseries.map((t) => ({ date: t.month, value: Number(t.netWorth) || 0 }));
  const lastYearEntry = timeseries.length >= 13 ? timeseries[timeseries.length - 13] : null;
  const snapshotDate = timeseries[timeseries.length - 1]?.month ?? '—';

  // 자산군별 기여도 (도넛)
  const donut: { category: string; isLiability: boolean; valueKRW: number }[] = dash?.donut ?? [];
  const contributions = donut
    .filter((d) => !d.isLiability)
    .map((d) => {
      const key = normalizeAssetCategory(d.category);
      return {
        category: CATEGORY_LABEL[key] ?? key,
        value: Number(d.valueKRW) || 0,
        color: CATEGORY_COLOR[key] ?? '#8B95A1',
      };
    });

  // 자산
  const assets = rawAssets.map((a: any) => {
    const latestKRW = Number(a.latestSnapshot?.valueKRW) || 0;
    const prevKRW = a.prevSnapshot != null ? Number(a.prevSnapshot.valueKRW) || 0 : null;
    const delta = prevKRW != null ? latestKRW - prevKRW : null;
    return {
      id: String(a.id),
      name: a.name,
      category: normalizeAssetCategory(a.category),
      currency: a.currency ?? 'KRW',
      currencyValue: a.currency !== 'KRW' ? Number(a.latestSnapshot?.value) || 0 : undefined,
      fxRate: a.currency !== 'KRW' ? Number(a.latestSnapshot?.fxRateToKRW) || 0 : undefined,
      value: latestKRW,
      isLiability: a.isLiability,
      ownerUserId: a.ownerUserId ?? null,
      delta,
      deltaPct: delta != null && prevKRW ? (delta / prevKRW) * 100 : null,
      snapshotDate: a.latestSnapshot?.date ?? undefined,
    };
  });

  // 카테고리 id → 카테고리 객체 맵 (거래/정기거래 응답엔 categoryId만 오고 관계가 join되어 있지 않음)
  const categoryById = new Map<number, any>(rawCategories.map((c: any) => [c.id, c]));

  // 거래내역
  const transactions = rawTx.map((t: any) => ({
    id: String(t.id),
    date: t.date,
    type: t.type,
    amount: Number(t.amount) || 0,
    category: categoryById.get(t.categoryId)?.name ?? '기타',
    categoryId: t.categoryId ?? null,
    title: t.title || t.memo || categoryById.get(t.categoryId)?.name || '거래',
    rawTitle: t.title || undefined,
    memo: t.memo ?? undefined,
    from: t.fromAssetId != null ? String(t.fromAssetId) : undefined,
    to: t.toAssetId != null ? String(t.toAssetId) : undefined,
    auto: t.autoGenerated ?? false,
  }));

  // 정기 거래
  const recurring = rawRecurring.map((r: any) => ({
    id: String(r.id),
    title: r.title ?? r.name ?? '항목',
    amount: Number(r.amount) || 0,
    category: categoryById.get(r.categoryId)?.name ?? '기타',
    categoryId: r.categoryId ?? null,
    dayOfMonth: r.dayOfMonth,
    from: r.fromAssetId != null ? String(r.fromAssetId) : '',
    active: r.active,
    nextDate: r.active ? computeNextDate(r.dayOfMonth) : '—',
    type: (r.type === 'INCOME' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
    startDate: r.startDate ?? undefined,
    endDate: r.endDate ?? undefined,
  }));

  // 멤버
  const members = rawMembers.map((m: any) => ({
    id: String(m.userId ?? m.id),
    name: m.user?.name ?? '멤버',
    role: m.role,
    avatar: m.user?.avatarColor ?? '#8B95A1',
    initial: m.user?.initial ?? '?',
  }));

  // 카테고리
  const categories = rawCategories.map((c: any) => ({
    id: c.id,
    householdId: c.householdId ?? null,
    type: c.type,
    name: c.name,
    icon: c.icon,
    color: c.color ?? null,
    parentId: c.parentId ?? null,
    isBuiltin: c.isBuiltin ?? false,
  }));

  // 초대 (받은 것)
  const pendingInvites = rawInvitations.map((inv: any) => ({
    id: String(inv.id),
    code: inv.code,
    role: inv.role,
    household: currentHousehold?.name ?? '',
    expiresAt: inv.expiresAt,
  }));

  return {
    netWorth: {
      current: Number(dash?.netWorth) || 0,
      lastYear: Number(lastYearEntry?.netWorth) || 0,
      snapshotDate,
      monthlyHistory,
    },
    contributions,
    assets,
    transactions,
    recurring,
    members,
    pendingInvites,
    categories,
    isLoading,
  };
}
