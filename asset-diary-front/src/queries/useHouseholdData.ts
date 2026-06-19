import { useQuery } from '@tanstack/react-query';
import { dashboardApi, assetsApi, txApi, recurringApi, householdsApi, categoriesApi } from '../api';
import { useAuthStore } from '../stores/auth.store';
import type { MockPersona } from '../lib/mock-data';
import type { AssetCategory } from '../types/api';
import { ASSET_CATEGORY_META } from '../lib/category-meta';
import { qk } from './keys';

// 백엔드 자산 카테고리 enum(REAL_ASSET/DEBT)을 프론트 키(REAL_ESTATE/LIABILITY)로 정규화
const CATEGORY_ALIAS: Record<string, string> = {
  REAL_ASSET: 'REAL_ESTATE',
  DEBT: 'LIABILITY',
};
function normalizeAssetCategory(c: string): AssetCategory {
  return (CATEGORY_ALIAS[c] ?? c) as AssetCategory;
}

// ASSET_CATEGORY_META를 단일 소스로 — 도넛/자산 리스트와 일치
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

const EMPTY: MockPersona = {
  netWorth: { current: 0, lastYear: 0, snapshotDate: '—', monthlyHistory: [], yearly: [] },
  yearlyContrib: {},
  contributions: [],
  assets: [],
  snapshots: {},
  transactions: [],
  recurring: [],
  members: [],
  pendingInvites: [],
  categories: [],
};

function computeNextDate(dayOfMonth: number): string {
  const today = new Date();
  const candidate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (candidate <= today) candidate.setMonth(candidate.getMonth() + 1);
  return candidate.toISOString().split('T')[0]!;
}

export function useHouseholdData(): MockPersona {
  const { currentHousehold, useMock } = useAuthStore();
  const hid = currentHousehold?.id;
  const enabled = !!hid && !useMock;

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

  if (!hid || useMock) return EMPTY;

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
  const assets = rawAssets.map((a: any) => ({
    id: String(a.id),
    name: a.name,
    category: normalizeAssetCategory(a.category),
    currency: a.currency ?? 'KRW',
    currencyValue: a.currency !== 'KRW' ? Number(a.latestSnapshot?.value) || 0 : undefined,
    fxRate: a.currency !== 'KRW' ? Number(a.latestSnapshot?.fxRateToKRW) || 0 : undefined,
    value: Number(a.latestSnapshot?.valueKRW) || 0,
    isLiability: a.isLiability,
    delta: 0,
    deltaPct: 0,
  }));

  // 거래내역
  const transactions = rawTx.map((t: any) => ({
    id: String(t.id),
    date: t.date,
    type: t.type,
    amount: Number(t.amount) || 0,
    category: t.category?.name ?? '기타',
    title: t.memo || t.category?.name || '거래',
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
    category: r.category?.name ?? '기타',
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
    joined: '',
  }));

  // 카테고리
  const categories = rawCategories.map((c: any) => ({
    id: c.id,
    householdId: c.householdId ?? null,
    type: c.type,
    name: c.name,
    icon: c.icon,
    isBuiltin: c.isBuiltin ?? false,
  }));

  // 초대 (받은 것)
  const pendingInvites = rawInvitations.map((inv: any) => ({
    id: String(inv.id),
    code: inv.code,
    role: inv.role,
    from: '',
    household: currentHousehold?.name ?? '',
    expiresAt: inv.expiresAt,
  }));

  return {
    netWorth: {
      current: Number(dash?.netWorth) || 0,
      lastYear: Number(lastYearEntry?.netWorth) || 0,
      snapshotDate,
      monthlyHistory,
      yearly: [],
    },
    yearlyContrib: {},
    contributions,
    assets,
    snapshots: {},
    transactions,
    recurring,
    members,
    pendingInvites,
    categories,
  };
}
