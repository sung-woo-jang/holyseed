// 안드로이드 전용 기능 — 웹/iOS 번들에는 네이티브 모듈(react-native-android-widget)이 없으므로 빈 구현.
// 실제 구현은 index.android.ts
export function registerWidgets(): void {}

export async function refreshAllWidgets(_force?: boolean): Promise<void> {}
