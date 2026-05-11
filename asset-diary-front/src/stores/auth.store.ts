import { create } from 'zustand';

interface AdUser {
  id: number;
  tossUserKey: string;
  name: string;
  avatarColor: string;
  initial: string;
}

interface Household {
  id: number;
  name: string;
  icon: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

interface AuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: AdUser | null;
  households: Household[];
  currentHousehold: Household | null;
  setReady: () => void;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: AdUser) => void;
  setHouseholds: (households: Household[], current?: Household) => void;
  setCurrentHousehold: (household: Household) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  households: [],
  currentHousehold: null,

  setReady: () => set({ isReady: true }),

  setAuth: (tokens, user) =>
    set({
      isAuthenticated: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    }),

  setHouseholds: (households, current) =>
    set({
      households,
      currentHousehold: current ?? households[0] ?? null,
    }),

  setCurrentHousehold: (household) => set({ currentHousehold: household }),

  logout: () =>
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      households: [],
      currentHousehold: null,
    }),
}));
