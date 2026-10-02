// APK 자체 업데이트는 안드로이드 전용 — 웹/iOS 번들엔 네이티브 모듈(expo-intent-launcher 등)이 없으므로 빈 구현.
// 실제 구현은 index.android.ts

export type ApkCheckResult = 'available' | 'latest' | 'error' | 'unsupported';

export async function checkApkUpdate(_manual?: boolean): Promise<ApkCheckResult> {
  return 'unsupported';
}

export async function startApkDownload(): Promise<void> {}

export async function installDownloadedApk(): Promise<void> {}

export const installedVersionLabel: string | null = null;
