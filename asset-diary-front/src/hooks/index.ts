import { useAuthStore } from '../stores/auth.store';

export function useHousehold() {
  const { currentHousehold, households, setCurrentHousehold } = useAuthStore();
  return { household: currentHousehold, households, setCurrentHousehold };
}

export function useRole() {
  const { currentHousehold } = useAuthStore();
  return currentHousehold?.role ?? 'VIEWER';
}

export function useIsViewer() {
  return useRole() === 'VIEWER';
}

export function useIsOwner() {
  return useRole() === 'OWNER';
}

export function useCanEdit() {
  const role = useRole();
  return role === 'OWNER' || role === 'EDITOR';
}
