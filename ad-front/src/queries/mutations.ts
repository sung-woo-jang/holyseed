import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assetsApi,
  snapshotsApi,
  txApi,
  recurringApi,
  categoriesApi,
  householdsApi,
} from '../api';
import { useAuthStore } from '../stores/auth.store';
import type { AssetCategory, CategoryType, MemberRole } from '../types/api';
import { qk } from './keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useHid() {
  return useAuthStore((s) => s.currentHousehold?.id);
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export function useCreateAsset() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (dto: { name: string; category: AssetCategory; currency?: string; isLiability?: boolean }) =>
      assetsApi.create(hid!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<{ name: string; category: AssetCategory; currency: string }> }) =>
      assetsApi.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
      qc.invalidateQueries({ queryKey: qk.asset(id) });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
      qc.invalidateQueries({ queryKey: qk.dashboard(hid!) });
    },
  });
}

// ─── Snapshots ────────────────────────────────────────────────────────────────

export function useUpsertSnapshot() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: ({ assetId, dto }: { assetId: number; dto: { date: string; value: number; fxRateToKRW?: number } }) =>
      snapshotsApi.upsert(assetId, dto),
    onSuccess: (_data, { assetId }) => {
      qc.invalidateQueries({ queryKey: qk.dashboard(hid!) });
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
      qc.invalidateQueries({ queryKey: qk.assetSnapshots(assetId) });
    },
  });
}

export function useBatchSnapshots() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (items: { assetId: number; date: string; value: number; fxRateToKRW?: number }[]) =>
      snapshotsApi.batch(hid!, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.dashboard(hid!) });
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useCreateTx() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (dto: {
      date: string;
      type: 'INCOME' | 'EXPENSE';
      amount: number;
      currency?: string;
      memo?: string;
      categoryId?: number;
      fromAssetId?: number;
      toAssetId?: number;
    }) => txApi.create(hid!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions(hid!) });
      qc.invalidateQueries({ queryKey: qk.dashboard(hid!) });
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
    },
  });
}

export function useUpdateTx() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: ({ id, dto }: {
      id: number;
      dto: Partial<{ date: string; type: 'INCOME' | 'EXPENSE'; amount: number; categoryId: number; fromAssetId: number; toAssetId: number; memo: string }>;
    }) => txApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions(hid!) });
      qc.invalidateQueries({ queryKey: qk.dashboard(hid!) });
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
    },
  });
}

export function useDeleteTx() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (id: number) => txApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions(hid!) });
      qc.invalidateQueries({ queryKey: qk.dashboard(hid!) });
      qc.invalidateQueries({ queryKey: qk.assets(hid!) });
    },
  });
}

// ─── Recurring ────────────────────────────────────────────────────────────────

export function useCreateRecurring() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (dto: {
      title: string;
      type: 'INCOME' | 'EXPENSE';
      amount?: number;
      currency?: string;
      categoryId?: number;
      fromAssetId?: number;
      toAssetId?: number;
      frequency: 'MONTHLY' | 'YEARLY';
      dayOfMonth: number;
      startDate: string;
      endDate?: string;
    }) => recurringApi.create(hid!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring(hid!) });
    },
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: ({ id, dto }: {
      id: number;
      dto: Partial<{ title: string; type: 'INCOME' | 'EXPENSE'; amount: number; categoryId: number; fromAssetId: number; toAssetId: number; dayOfMonth: number; startDate: string; endDate: string }>;
    }) => recurringApi.update(id, dto as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring(hid!) });
    },
  });
}

export function useToggleRecurring() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (id: number) => recurringApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring(hid!) });
    },
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (id: number) => recurringApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recurring(hid!) });
    },
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (dto: { type: CategoryType; name: string; icon: string }) =>
      categoriesApi.create(hid!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories(hid!) });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<{ name: string; icon: string }> }) =>
      categoriesApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories(hid!) });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories(hid!) });
    },
  });
}

// ─── Members & Invitations ────────────────────────────────────────────────────

export function useUpdateRole() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: MemberRole }) =>
      householdsApi.updateRole(hid!, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.members(hid!) });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (userId: number) => householdsApi.removeMember(hid!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.members(hid!) });
    },
  });
}

export function useInvite() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (role: MemberRole) => householdsApi.invite(hid!, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.invitations(hid!) });
    },
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  const hid = useHid();
  return useMutation({
    mutationFn: (id: number) => householdsApi.revokeInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.invitations(hid!) });
    },
  });
}

