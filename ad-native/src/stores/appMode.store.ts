import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type AppMode = 'assetDiary' | 'lab';

const KEY = 'app_mode';
const isWeb = Platform.OS === 'web';

async function readStoredMode(): Promise<AppMode | null> {
  try {
    const raw = isWeb ? window.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return raw === 'lab' || raw === 'assetDiary' ? raw : null;
  } catch {
    return null;
  }
}

async function writeStoredMode(mode: AppMode): Promise<void> {
  try {
    if (isWeb) window.localStorage.setItem(KEY, mode);
    else await SecureStore.setItemAsync(KEY, mode);
  } catch {
    // 모드 저장 실패는 다음 실행 시 기본 모드로 여는 정도의 영향만 있어 무시
  }
}

interface AppModeState {
  isReady: boolean;
  mode: AppMode;
  restore: () => Promise<void>;
  switchMode: (mode: AppMode) => Promise<void>;
}

export const useAppModeStore = create<AppModeState>((set) => ({
  isReady: false,
  mode: 'assetDiary',

  restore: async () => {
    const stored = await readStoredMode();
    set({ mode: stored ?? 'assetDiary', isReady: true });
  },

  switchMode: async (mode: AppMode) => {
    set({ mode });
    await writeStoredMode(mode);
  },
}));
