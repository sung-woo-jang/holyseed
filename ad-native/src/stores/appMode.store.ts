import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type AppMode = 'assetDiary' | 'laofus' | 'worklog';

const VALID_MODES: AppMode[] = ['assetDiary', 'laofus', 'worklog'];
const KEY = 'app_mode';
const isWeb = Platform.OS === 'web';

async function readStoredMode(): Promise<AppMode | null> {
  try {
    const raw = isWeb ? window.localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return VALID_MODES.includes(raw as AppMode) ? (raw as AppMode) : null;
  } catch (e) {
    console.warn('[appMode] 저장된 모드 읽기 실패', e);
    return null;
  }
}

async function writeStoredMode(mode: AppMode): Promise<void> {
  try {
    if (isWeb) window.localStorage.setItem(KEY, mode);
    else await SecureStore.setItemAsync(KEY, mode);
  } catch (e) {
    // 모드 저장 실패는 다음 실행 시 기본 모드로 여는 정도의 영향만 있어 무시
    console.warn('[appMode] 모드 저장 실패', e);
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
    // 저장이 끝나기 전에 화면(=RootNavigator)이 먼저 전환되면, 그 직후 사용자가 앱을 강제종료할 때
    // 저장이 유실될 수 있어 순서를 반드시 이렇게 유지 — 쓰기 완료 후에만 화면 전환.
    await writeStoredMode(mode);
    set({ mode });
  },
}));
