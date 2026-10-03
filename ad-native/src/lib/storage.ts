import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY_ACCESS = 'ad_accessToken';
const KEY_REFRESH = 'ad_refreshToken';

const isWeb = Platform.OS === 'web';

async function getItem(key: string) {
  return isWeb ? window.localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (isWeb) {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  if (isWeb) {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([getItem(KEY_ACCESS), getItem(KEY_REFRESH)]);
  return { accessToken, refreshToken };
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([setItem(KEY_ACCESS, accessToken), setItem(KEY_REFRESH, refreshToken)]);
}

export async function clearTokens() {
  await Promise.all([deleteItem(KEY_ACCESS), deleteItem(KEY_REFRESH)]);
}

const KEY_HOUSEHOLD = 'ad_currentHouseholdId';

/** 가구가 여러 개일 때 마지막으로 고른 가구 — 앱 재시작·위젯이 같은 가구를 보게 */
export async function getStoredHouseholdId(): Promise<number | null> {
  try {
    const raw = await getItem(KEY_HOUSEHOLD);
    const n = Number(raw);
    return raw && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function setStoredHouseholdId(id: number): Promise<void> {
  try {
    await setItem(KEY_HOUSEHOLD, String(id));
  } catch {
    // 저장 실패 시 첫 번째 가구로 열림
  }
}
