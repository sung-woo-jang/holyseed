import { create } from 'zustand';

interface AdUser {
  id: number;
  tossUserKey: string | null;
  email?: string | null;
  name: string;
  avatarColor: string;
  initial: string;
  /** 서버가 내려주는 소유자 여부 — false면 라오어·근무일지 모드를 숨긴다(없으면 소유자로 간주) */
  isOwner?: boolean;
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
  /** 서버에 닿지 못해 세션/가구를 못 불러온 상태 — 로그인·온보딩 대신 '다시 시도' 화면을 보여준다 */
  bootError: boolean;
  setBootError: (v: boolean) => void;
  setReady: () => void;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: AdUser) => void;
  setUser: (user: AdUser) => void;
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
  bootError: false,

  setBootError: (bootError) => set({ bootError }),

  setReady: () => set({ isReady: true }),

  setAuth: (tokens, user) =>
    set({
      isAuthenticated: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    }),

  setUser: (user) => set({ user }),

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
      bootError: false,
    }),
}));
