import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import { useAppModeStore, type AppMode } from '../stores/appMode.store';
import { useAuthStore } from '../stores/auth.store';
import { todayLocal } from './date';

type Target = 'asset' | 'laofus' | 'vr' | 'worklog' | 'worklog-add';

const PREFIX = 'adnative://widget/';

const MODE_OF: Record<Target, AppMode> = {
  asset: 'assetDiary',
  laofus: 'laofus',
  vr: 'laofus',
  worklog: 'worklog',
  'worklog-add': 'worklog',
};

function parseTarget(url: string | null): Target | null {
  if (!url || !url.startsWith(PREFIX)) return null;
  const t = url.slice(PREFIX.length).split(/[?#]/)[0] as Target;
  return t in MODE_OF ? t : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitUntil(cond: () => boolean, timeoutMs: number): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (cond()) return true;
    await sleep(100);
  }
  return cond();
}

function navigateTo(target: Target) {
  const nav = navigationRef as any;
  switch (target) {
    case 'asset':
      nav.navigate('Home');
      break;
    case 'laofus':
      nav.navigate('Strategy', { screen: 'LaofusHome' });
      break;
    case 'vr':
      nav.navigate('Strategy', { screen: 'VrOverview' });
      break;
    case 'worklog':
      nav.navigate('Worklog', { screen: 'WorklogHome' });
      break;
    case 'worklog-add':
      nav.navigate('Worklog', { screen: 'WorklogEntry', params: { record: null, defaultDate: todayLocal() } });
      break;
  }
}

let handling = false;

/** 위젯 탭(adnative://widget/<대상>) → 필요한 앱 모드로 전환한 뒤 해당 화면으로 이동 */
async function openTarget(target: Target): Promise<void> {
  if (handling) return;
  handling = true;
  try {
    // 콜드 스타트: 세션 복원·모드 복원·내비게이션 준비가 끝날 때까지 대기
    const ready = await waitUntil(
      () => navigationRef.isReady() && useAuthStore.getState().isReady && useAppModeStore.getState().isReady,
      15000,
    );
    if (!ready) return;

    const wantMode = MODE_OF[target];
    if (useAppModeStore.getState().mode !== wantMode) {
      await useAppModeStore.getState().switchMode(wantMode);
      // 모드가 바뀌면 최상위 내비게이터가 통째로 다시 마운트되고, RootNavigator가 첫 탭으로 이동시킨다 — 그 뒤에 이동
      await sleep(600);
      await waitUntil(() => navigationRef.isReady(), 5000);
    } else {
      await sleep(150);
    }
    navigateTo(target);
  } finally {
    handling = false;
  }
}

export function useWidgetLinks(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Linking.getInitialURL().then((url) => {
      const t = parseTarget(url);
      if (t) void openTarget(t);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      const t = parseTarget(url);
      if (t) void openTarget(t);
    });
    return () => sub.remove();
  }, []);
}
