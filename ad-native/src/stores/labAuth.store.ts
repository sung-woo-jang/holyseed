import { create } from 'zustand';

export interface LabUser {
  id: number;
  email: string;
  name: string;
}

interface LabAuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: LabUser | null;
  setReady: () => void;
  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: LabUser) => void;
  logout: () => void;
}

export const useLabAuthStore = create<LabAuthState>((set) => ({
  isReady: false,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  setReady: () => set({ isReady: true }),

  setAuth: (tokens, user) =>
    set({
      isAuthenticated: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    }),
}));
