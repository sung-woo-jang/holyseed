import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { navigationRef } from '../navigation/navigationRef';
import { useAppModeStore, type AppMode } from '../stores/appMode.store';
import { useAuthStore } from '../stores/auth.store';
import { todayLocal } from './date';
import { setWidgetLinkActive } from './widget-link-state';

type Target = 'asset' | 'ledger' | 'ledger-add' | 'laofus' | 'vr' | 'worklog' | 'worklog-add';

const PREFIX = 'adnative://widget/';

const MODE_OF: Record<Target, AppMode> = {
  asset: 'assetDiary',
  ledger: 'assetDiary',
  'ledger-add': 'assetDiary',
  laofus: 'laofus',
  vr: 'laofus',
  worklog: 'worklog',
  'worklog-add': 'worklog',
};

/** 이동이 끝났다고 볼 포커스 경로 (탭 → 화면). 이 경로로 시작하면 성공 */
const FOCUS_PATH: Record<Target, string[]> = {
  asset: ['Home'],
  ledger: ['Book', 'BookHome'],
  'ledger-add': ['Book', 'TransactionEdit'],
  laofus: ['Strategy', 'LaofusHome'],
  vr: ['Strategy', 'VrOverview'],
  worklog: ['Worklog', 'WorklogHome'],
  'worklog-add': ['Worklog', 'WorklogEntry'],
};

interface Link {
  target: Target;
  /** worklog-add에서 미리 채울 날짜(YYYY-MM-DD) */
  date?: string;
}

// 앱 시작 직후 OTA 자동 재시작 등으로 JS가 다시 뜨면 메모리에 있던 대기 중 이동이 사라지므로, 받은 링크를 잠깐 저장해 둔다
const PENDING_KEY = 'widget_pending_link';
const PENDING_TTL_MS = 2 * 60 * 1000;
/** 같은 링크가 getInitialURL·url 이벤트·저장분으로 겹쳐 들어와도 한 번만 처리 */
const DUPLICATE_WINDOW_MS = 3000;
const READY_TIMEOUT_MS = 15000;
const NAVIGATE_TIMEOUT_MS = 5000;
const RENAVIGATE_EVERY_MS = 700;

function parseTarget(url: string | null): Link | null {
  if (!url || !url.startsWith(PREFIX)) return null;
  const [path, query = ''] = url.slice(PREFIX.length).split('?');
  const target = path as Target;
  if (!(target in MODE_OF)) return null;
  const date = /(?:^|&)date=(\d{4}-\d{2}-\d{2})/.exec(query)?.[1];
  return { target, date };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitUntil(cond: () => boolean, timeoutMs: number, aborted: () => boolean = () => false): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (aborted()) return false;
    if (cond()) return true;
    await sleep(100);
  }
  return cond();
}

function navigateTo({ target, date }: Link) {
  const nav = navigationRef as any;
  switch (target) {
    case 'asset':
      nav.navigate('Home');
      break;
    case 'ledger':
      nav.navigate('Book', { screen: 'BookHome' });
      break;
    case 'ledger-add':
      // initial:false — 거래장부 홈을 스택 맨 아래에 둔 채 입력 화면을 올려, 저장 후 popTo('BookHome')가 동작하게 한다
      nav.navigate('Book', { screen: 'TransactionEdit', params: { mode: 'add', date: date ?? todayLocal(), returnTo: 'BookHome' }, initial: false });
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
      nav.navigate('Worklog', { screen: 'WorklogEntry', params: { record: null, defaultDate: date ?? todayLocal() }, initial: false });
      break;
  }
}

/** 지금 포커스된 화면 경로 (탭 → 스택 화면 …). 아직 마운트되지 않은 안쪽 내비게이터는 경로가 거기서 끊긴다 */
function focusedPath(): string[] {
  const path: string[] = [];
  let state: any = navigationRef.isReady() ? navigationRef.getRootState() : undefined;
  while (state && state.routes?.length) {
    const route = state.routes[state.index ?? 0];
    if (!route) break;
    path.push(route.name);
    state = route.state;
  }
  return path;
}

function arrivedAt(link: Link): boolean {
  if (useAppModeStore.getState().mode !== MODE_OF[link.target]) return false;
  const want = FOCUS_PATH[link.target];
  const now = focusedPath();
  return want.every((name, i) => now[i] === name);
}

const keyOf = (l: Link) => `${l.target}|${l.date ?? ''}`;

async function savePending(link: Link): Promise<void> {
  try {
    await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify({ ...link, at: Date.now() }));
  } catch {
    // 저장 실패해도 이번 실행 안에서의 이동엔 영향 없음
  }
}

async function clearPending(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PENDING_KEY);
  } catch {
    // 남아 있어도 TTL(2분)이 지나면 무시된다
  }
}

async function readPending(): Promise<Link | null> {
  try {
    const raw = await SecureStore.getItemAsync(PENDING_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Link & { at: number };
    if (!(v.target in MODE_OF) || Date.now() - v.at > PENDING_TTL_MS) return null;
    return { target: v.target, date: v.date };
  } catch {
    return null;
  }
}

/** 필요한 앱 모드로 전환한 뒤 목적 화면에 도착할 때까지 이동한다 (도착을 확인하면 true) */
async function openTarget(link: Link, superseded: () => boolean): Promise<boolean> {
  // 콜드 스타트: 세션 복원·모드 복원·내비게이션 준비가 끝날 때까지 대기
  const ready = await waitUntil(
    () => navigationRef.isReady() && useAuthStore.getState().isReady && useAppModeStore.getState().isReady,
    READY_TIMEOUT_MS,
    superseded,
  );
  if (superseded()) return false;
  if (!ready) {
    console.warn('[widget-links] 앱 준비 대기 시간 초과', link.target);
    return false;
  }

  const wantMode = MODE_OF[link.target];
  if (useAppModeStore.getState().mode !== wantMode) {
    // 모드가 바뀌면 최상위 내비게이터가 통째로 다시 마운트된다 — 새 내비게이터가 뜰 때까지는 아래 도착 확인 루프가 기다린다
    await useAppModeStore.getState().switchMode(wantMode);
  }

  // 한 번 navigate 하고 끝내지 않고, 목적 화면에 실제로 도착했는지 확인하며 필요하면 다시 이동한다
  // (내비게이터 마운트·전략 탭의 비동기 초기 화면 결정·모드 전환 직후의 첫 탭 이동과 겹쳐 한 번으로는 놓칠 수 있음)
  const end = Date.now() + NAVIGATE_TIMEOUT_MS;
  let lastNavigate = 0;
  while (Date.now() < end) {
    if (superseded()) return false;
    if (navigationRef.isReady() && useAppModeStore.getState().mode === wantMode) {
      if (arrivedAt(link)) return true;
      if (Date.now() - lastNavigate >= RENAVIGATE_EVERY_MS) {
        lastNavigate = Date.now();
        navigateTo(link);
      }
    }
    await sleep(120);
  }
  console.warn('[widget-links] 목적 화면 도착 확인 실패', link.target, focusedPath().join('>'));
  return false;
}

let latest: Link | null = null;
let draining = false;
let lastSeen: { key: string; at: number } | null = null;

/** 대기 중인 링크를 하나씩 처리한다. 처리 중 새 링크가 오면 가장 마지막 것만 남겨 그쪽으로 이동 */
async function drain(): Promise<void> {
  draining = true;
  try {
    while (latest) {
      const link = latest;
      await openTarget(link, () => latest !== link);
      if (latest !== link) continue; // 도중에 더 최신 링크가 들어왔다
      latest = null;
      await clearPending(); // 성공이든 실패든 정리 — 남겨 두면 오래 뒤 엉뚱한 때 다시 이동할 수 있다
    }
  } finally {
    draining = false;
    setWidgetLinkActive(false);
  }
}

function submit(link: Link, persist: boolean): void {
  const key = keyOf(link);
  const now = Date.now();
  if (lastSeen && lastSeen.key === key && now - lastSeen.at < DUPLICATE_WINDOW_MS) return;
  lastSeen = { key, at: now };
  latest = link;
  setWidgetLinkActive(true);
  if (persist) void savePending(link);
  if (!draining) void drain();
}

/** 위젯 탭(adnative://widget/<대상>) → 필요한 앱 모드로 전환한 뒤 해당 화면으로 이동 */
export function useWidgetLinks(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let alive = true;
    Linking.getInitialURL().then(async (url) => {
      const t = parseTarget(url);
      if (t) return submit(t, true);
      // 시작 URL이 없어도(앱이 OTA로 다시 시작된 경우 등) 직전에 받아 둔 위젯 링크가 남아 있으면 이어서 처리
      const pending = await readPending();
      if (alive && pending) submit(pending, false);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      const t = parseTarget(url);
      if (t) submit(t, true);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
}
