import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { SortPref } from '../api/lab-worklog';

const KEY_WORKLOG_SORT = 'lab_worklogSortPref';
const isWeb = Platform.OS === 'web';

async function readRaw(key: string): Promise<string | null> {
  return isWeb ? window.localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function writeRaw(key: string, value: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

/**
 * 근무일지 정렬 상태 — 이 기기에만 로컬 저장.
 * 데스크톱(lab-front)의 서버 저장 sort-pref는 lab.users row id 기준인데, ad-native는
 * ad 토큰(ad.users id)을 그대로 재사용하는 구조라 그 API를 그대로 호출하면 id가 어긋나
 * 404가 날 수 있어(아키텍처 문서 참고) — 굳이 서버 동기화할 필요 없는 개인 UI 설정이라 로컬로 대체.
 */
export async function getWorklogSortPref(): Promise<SortPref | null> {
  try {
    const raw = await readRaw(KEY_WORKLOG_SORT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setWorklogSortPref(pref: SortPref): Promise<void> {
  await writeRaw(KEY_WORKLOG_SORT, JSON.stringify(pref));
}
