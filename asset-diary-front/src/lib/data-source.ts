import { useAuthStore } from '../stores/auth.store';
import { MOCK_PERSONA } from './mock-data';
import type { MockPersona } from './mock-data';
import { useHouseholdData } from '../queries/useHouseholdData';

export function useDataSource(): MockPersona {
  const { useMock } = useAuthStore();
  const real = useHouseholdData();
  return useMock ? MOCK_PERSONA : real;
}

export function useMockRole() {
  const { roleOverride, currentHousehold } = useAuthStore();
  if (roleOverride) return roleOverride;
  return (currentHousehold?.role ?? 'OWNER') as 'OWNER' | 'EDITOR' | 'VIEWER';
}
