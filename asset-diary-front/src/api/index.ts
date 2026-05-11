import { api } from '../lib/api';
import type {
  Asset,
  AssetCategory,
  AssetSnapshot,
  Category,
  CategoryType,
  Invitation,
  Member,
  MemberRole,
  RecurringFrequency,
  RecurringTransaction,
  Transaction,
  TxType,
} from '../types/api';

// ─── Assets ───────────────────────────────────────────────────────────────────
export const assetsApi = {
  list: (householdId: number) =>
    api.get<Asset[]>(`/households/${householdId}/assets`).then((r) => r.data),

  search: (householdId: number, params: { search?: string; category?: AssetCategory; includeArchived?: boolean }) =>
    api.post<Asset[]>(`/households/${householdId}/assets/search`, params).then((r) => r.data),

  get: (id: number) => api.get<Asset>(`/assets/${id}`).then((r) => r.data),

  create: (householdId: number, dto: { name: string; category: AssetCategory; currency?: string; isLiability?: boolean }) =>
    api.post<Asset>(`/households/${householdId}/assets`, dto).then((r) => r.data),

  update: (id: number, dto: Partial<{ name: string; category: AssetCategory; currency: string }>) =>
    api.post<Asset>(`/assets/${id}/update`, dto).then((r) => r.data),

  archive: (id: number) => api.post(`/assets/${id}/archive`).then((r) => r.data),
  delete: (id: number) => api.post(`/assets/${id}/delete`).then((r) => r.data),
};

// ─── Snapshots ────────────────────────────────────────────────────────────────
export const snapshotsApi = {
  upsert: (assetId: number, dto: { date: string; value: number; fxRateToKRW?: number }) =>
    api.post<AssetSnapshot>(`/assets/${assetId}/snapshots`, dto).then((r) => r.data),

  batch: (householdId: number, items: { assetId: number; date: string; value: number; fxRateToKRW?: number }[]) =>
    api.post(`/households/${householdId}/snapshots/batch`, { items }).then((r) => r.data),

  list: (assetId: number) =>
    api.post<AssetSnapshot[]>(`/assets/${assetId}/snapshots/search`, {}).then((r) => r.data),

  delete: (id: number) => api.post(`/asset-snapshots/${id}/delete`).then((r) => r.data),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const txApi = {
  recent: (householdId: number) =>
    api.get<Transaction[]>(`/households/${householdId}/transactions/recent`).then((r) => r.data),

  search: (
    householdId: number,
    params: { from?: string; to?: string; type?: TxType; categoryId?: number; page?: number; limit?: number },
  ) =>
    api
      .post<{ data: Transaction[]; total: number }>(`/households/${householdId}/transactions/search`, params)
      .then((r) => r.data),

  create: (
    householdId: number,
    dto: {
      date: string;
      type: TxType;
      amount: number;
      currency?: string;
      memo?: string;
      categoryId?: number;
      fromAssetId?: number;
      toAssetId?: number;
      tags?: string[];
    },
  ) => api.post<Transaction>(`/households/${householdId}/transactions`, dto).then((r) => r.data),

  update: (id: number, dto: Partial<{ date: string; amount: number; memo: string; categoryId: number }>) =>
    api.post<Transaction>(`/transactions/${id}/update`, dto).then((r) => r.data),

  delete: (id: number) => api.post(`/transactions/${id}/delete`).then((r) => r.data),
};

// ─── Recurring ────────────────────────────────────────────────────────────────
export const recurringApi = {
  list: (householdId: number) =>
    api.get<RecurringTransaction[]>(`/households/${householdId}/recurring`).then((r) => r.data),

  create: (
    householdId: number,
    dto: {
      name: string;
      type: TxType;
      amount: number;
      currency?: string;
      categoryId?: number;
      fromAssetId?: number;
      toAssetId?: number;
      frequency: RecurringFrequency;
      dayOfMonth: number;
      monthOfYear?: number;
      startDate: string;
    },
  ) => api.post<RecurringTransaction>(`/households/${householdId}/recurring`, dto).then((r) => r.data),

  update: (id: number, dto: Partial<RecurringTransaction>) =>
    api.post<RecurringTransaction>(`/recurring/${id}/update`, dto).then((r) => r.data),

  toggle: (id: number) => api.post(`/recurring/${id}/toggle`).then((r) => r.data),
  delete: (id: number) => api.post(`/recurring/${id}/delete`).then((r) => r.data),
  runNow: (id: number) => api.post(`/recurring/${id}/run-now`).then((r) => r.data),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: (householdId: number) =>
    api.get<Category[]>(`/households/${householdId}/categories`).then((r) => r.data),

  create: (householdId: number, dto: { type: CategoryType; name: string; icon: string }) =>
    api.post<Category>(`/households/${householdId}/categories`, dto).then((r) => r.data),

  update: (id: number, dto: Partial<{ name: string; icon: string }>) =>
    api.post<Category>(`/categories/${id}/update`, dto).then((r) => r.data),

  delete: (id: number) => api.post(`/categories/${id}/delete`).then((r) => r.data),
};

// ─── Households / Members / Invitations ───────────────────────────────────────
export const householdsApi = {
  members: (householdId: number) =>
    api.get<Member[]>(`/households/${householdId}/members`).then((r) => r.data),

  updateRole: (householdId: number, userId: number, role: MemberRole) =>
    api.post(`/households/${householdId}/members/${userId}/role`, { role }).then((r) => r.data),

  removeMember: (householdId: number, userId: number) =>
    api.post(`/households/${householdId}/members/${userId}/remove`).then((r) => r.data),

  invitations: (householdId: number) =>
    api.get<Invitation[]>(`/households/${householdId}/invitations`).then((r) => r.data),

  invite: (householdId: number, role: MemberRole) =>
    api.post<Invitation>(`/households/${householdId}/invitations`, { role }).then((r) => r.data),

  revokeInvitation: (id: number) => api.post(`/invitations/${id}/revoke`).then((r) => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: (householdId: number) =>
    api.get(`/households/${householdId}/dashboard`).then((r) => r.data),
};
