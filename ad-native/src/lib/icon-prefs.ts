import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY_HIDDEN_ICONS = 'ad_hiddenCategoryIcons';
const isWeb = Platform.OS === 'web';

async function readRaw(): Promise<string | null> {
  return isWeb ? window.localStorage.getItem(KEY_HIDDEN_ICONS) : SecureStore.getItemAsync(KEY_HIDDEN_ICONS);
}

async function writeRaw(value: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(KEY_HIDDEN_ICONS, value);
    return;
  }
  await SecureStore.setItemAsync(KEY_HIDDEN_ICONS, value);
}

/** 카테고리 아이콘 선택 시트에서 이 기기에서만 숨긴 이모지 id 목록 (가구 공유 아님, 이 기기 로컬 전용) */
export async function getHiddenIconIds(): Promise<string[]> {
  try {
    const raw = await readRaw();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setHiddenIconIds(ids: string[]): Promise<void> {
  await writeRaw(JSON.stringify(ids));
}
