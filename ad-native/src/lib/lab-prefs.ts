import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { SortPref } from '../api/lab-worklog';

const KEY_WORKLOG_SORT = 'lab_worklogSortPref';
const KEY_WORKLOG_SUMMARY_HIDDEN_FIELDS = 'lab_worklogSummaryHiddenFields';
const KEY_VR_FILLS_SORT = 'lab_vrFillsSortPref';
const KEY_LAOFUS_WEALTH_SORT = 'lab_laofusWealthSortPref';
const KEY_LAOFUS_LAST_COPY = 'lab_laofusWealthLastCopyDate';
const KEY_LAOFUS_DISMISSED_ERROR_ID = 'lab_laofusDismissedErrorId';
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
 * 정렬 등 개인 UI 설정을 이 기기에만 로컬 저장 — 서버 동기화 안 함(데스크톱 lab-front의
 * 서버 저장 sort-pref는 lab.users row id 기준인데, ad-native는 ad 토큰(ad.users id)을
 * 그대로 재사용하는 구조라 그 API를 그대로 호출하면 id가 어긋나 404가 날 수 있음).
 */
async function getPref<T>(key: string): Promise<T | null> {
  try {
    const raw = await readRaw(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setPref<T>(key: string, value: T): Promise<void> {
  await writeRaw(key, JSON.stringify(value));
}

export async function getWorklogSortPref(): Promise<SortPref | null> {
  return getPref<SortPref>(KEY_WORKLOG_SORT);
}

export async function setWorklogSortPref(pref: SortPref): Promise<void> {
  return setPref(KEY_WORKLOG_SORT, pref);
}

export async function getWorklogSummaryHiddenFields(): Promise<string[] | null> {
  return getPref<string[]>(KEY_WORKLOG_SUMMARY_HIDDEN_FIELDS);
}

export async function setWorklogSummaryHiddenFields(fields: string[]): Promise<void> {
  return setPref(KEY_WORKLOG_SUMMARY_HIDDEN_FIELDS, fields);
}

export async function getVrFillsSortDir(): Promise<'asc' | 'desc' | null> {
  return getPref<'asc' | 'desc'>(KEY_VR_FILLS_SORT);
}

export async function setVrFillsSortDir(dir: 'asc' | 'desc'): Promise<void> {
  return setPref(KEY_VR_FILLS_SORT, dir);
}

export interface LaofusWealthSortPref {
  key: 'date' | 'amount';
  dir: 'asc' | 'desc';
}

export async function getLaofusWealthSortPref(): Promise<LaofusWealthSortPref | null> {
  return getPref<LaofusWealthSortPref>(KEY_LAOFUS_WEALTH_SORT);
}

export async function setLaofusWealthSortPref(pref: LaofusWealthSortPref): Promise<void> {
  return setPref(KEY_LAOFUS_WEALTH_SORT, pref);
}

export async function getLaofusLastCopyDate(): Promise<string | null> {
  return getPref<string>(KEY_LAOFUS_LAST_COPY);
}

export async function setLaofusLastCopyDate(date: string): Promise<void> {
  return setPref(KEY_LAOFUS_LAST_COPY, date);
}

/** 엔진 오류 카드 닫기 — 사용자가 닫은 마지막 에러 이벤트 id를 저장, 그 이하 id는 다시 안 띄움 */
export async function getLaofusDismissedErrorId(): Promise<number | null> {
  return getPref<number>(KEY_LAOFUS_DISMISSED_ERROR_ID);
}

export async function setLaofusDismissedErrorId(id: number): Promise<void> {
  return setPref(KEY_LAOFUS_DISMISSED_ERROR_ID, id);
}
