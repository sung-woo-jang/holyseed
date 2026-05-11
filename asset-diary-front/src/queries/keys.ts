export const qk = {
  assets: (householdId: number) => ['assets', householdId] as const,
  asset: (id: number) => ['asset', id] as const,
  assetSnapshots: (assetId: number) => ['snapshots', assetId] as const,
  transactions: (householdId: number, params?: object) =>
    params ? ['transactions', householdId, params] : ['transactions', householdId],
  transactionsRecent: (householdId: number) => ['transactions', householdId, 'recent'] as const,
  recurring: (householdId: number) => ['recurring', householdId] as const,
  categories: (householdId: number) => ['categories', householdId] as const,
  dashboard: (householdId: number) => ['dashboard', householdId] as const,
  members: (householdId: number) => ['members', householdId] as const,
  invitations: (householdId: number) => ['invitations', householdId] as const,
};
