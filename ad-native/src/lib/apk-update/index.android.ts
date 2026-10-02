import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { BASE_URL } from '../api';
import { useApkUpdateStore, type ApkInfo } from './store';

export type ApkCheckResult = 'available' | 'latest' | 'error' | 'unsupported';

// 백엔드가 ~/ad-native-updates/ 를 /ad-native-updates/ 로 정적 서빙한다 — `npm run publish-apk`가 apk/latest.json을 갱신
const MANIFEST_URL = BASE_URL.replace(/\/api\/ad\/?$/, '/ad-native-updates/apk/latest.json');
const AUTO_CHECK_INTERVAL_MS = 30 * 60 * 1000;

let lastAutoCheckAt = 0;

export const installedVersionLabel: string | null = `v${Application.nativeApplicationVersion ?? '?'} (${Application.nativeBuildVersion ?? '?'})`;

function apkPath(info: ApkInfo): string {
  return `${FileSystem.cacheDirectory}adnative-${info.versionCode}.apk`;
}

/** 새 APK가 올라왔는지 확인. 자동 확인은 30분에 한 번만, 사용자가 이미 "나중에"를 누른 버전은 건너뜀 */
export async function checkApkUpdate(manual = false): Promise<ApkCheckResult> {
  const store = useApkUpdateStore.getState();
  if (store.phase === 'downloading') return 'available';
  if (!manual && Date.now() - lastAutoCheckAt < AUTO_CHECK_INTERVAL_MS) return 'latest';
  lastAutoCheckAt = Date.now();

  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return 'error';
    const raw = (await res.json()) as Partial<ApkInfo> & { path?: string };
    if (!raw.versionCode || !raw.path || !raw.size) return 'error';
    const info: ApkInfo = {
      versionCode: raw.versionCode,
      versionName: raw.versionName ?? String(raw.versionCode),
      url: MANIFEST_URL.replace(/latest\.json$/, raw.path),
      size: raw.size,
      notes: raw.notes,
    };

    const installed = Number(Application.nativeBuildVersion);
    if (!Number.isFinite(installed) || info.versionCode <= installed) return 'latest';
    if (!manual && store.dismissedCode === info.versionCode) return 'available';

    const ready = store.phase === 'ready' && store.info?.versionCode === info.versionCode;
    store.set({ info, phase: ready ? 'ready' : 'available', visible: true, error: null });
    return 'available';
  } catch {
    return 'error';
  }
}

export async function startApkDownload(): Promise<void> {
  const { info, set } = useApkUpdateStore.getState();
  if (!info) return;
  const dest = apkPath(info);
  set({ phase: 'downloading', progress: 0, error: null, visible: true });
  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
    const task = FileSystem.createDownloadResumable(info.url, dest, {}, (p) => {
      const total = p.totalBytesExpectedToWrite || info.size;
      set({ progress: Math.min(1, p.totalBytesWritten / total) });
    });
    const result = await task.downloadAsync();
    if (!result || result.status !== 200) throw new Error(`다운로드 실패 (HTTP ${result?.status ?? '?'})`);
    const file = await FileSystem.getInfoAsync(dest);
    if (!file.exists || file.size !== info.size) throw new Error('받은 파일 크기가 달라요. 다시 시도해 주세요.');
    set({ phase: 'ready', progress: 1 });
    await installDownloadedApk();
  } catch (e) {
    await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => undefined);
    set({ phase: 'error', error: e instanceof Error ? e.message : '다운로드에 실패했어요.' });
  }
}

/** 받아둔 APK로 시스템 설치 화면을 연다 — "출처를 알 수 없는 앱" 허용을 처음 한 번 물을 수 있어 다시 누를 수 있게 남겨둠 */
export async function installDownloadedApk(): Promise<void> {
  const { info, set } = useApkUpdateStore.getState();
  if (!info) return;
  try {
    const uri = await FileSystem.getContentUriAsync(apkPath(info));
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: uri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
  } catch (e) {
    set({ phase: 'error', error: e instanceof Error ? e.message : '설치 화면을 열지 못했어요.' });
  }
}
