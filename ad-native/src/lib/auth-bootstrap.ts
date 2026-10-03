import { api } from './api';
import { getStoredHouseholdId, getTokens, setStoredHouseholdId } from './storage';
import { useAuthStore } from '../stores/auth.store';

/** 응답 자체가 없거나(오프라인·타임아웃) 서버 오류(5xx)면 "인증이 틀린 것"이 아니라 "잠시 못 닿은 것" */
export function isTransientError(e: unknown): boolean {
  const err = e as { response?: { status?: number } } | undefined;
  return !err?.response || (err.response.status ?? 0) >= 500;
}

/**
 * 가구 목록을 불러와 현재 가구를 정한다 — 이미 고른 가구가 있으면 유지(역할만 최신으로), 없으면 마지막으로 고른 가구, 그것도 없으면 첫 번째.
 * preferNewOver를 주면 그 목록에 없던 가구(방금 합류한 곳)를 우선 선택한다.
 * 네트워크 오류는 bootError로 올려 "가구를 만들어보세요" 화면이 잘못 뜨지 않게 한다.
 */
export async function loadHouseholds(opts: { preferNewOver?: number[]; silent?: boolean } = {}): Promise<boolean> {
  const store = useAuthStore.getState();
  try {
    const { data: res } = await api.get('/households');
    const list = (res.data ?? res) as { id: number; name: string; icon: string; role: 'OWNER' | 'EDITOR' | 'VIEWER' }[];
    const stored = await getStoredHouseholdId();
    const newcomer = opts.preferNewOver ? list.find((h) => !opts.preferNewOver!.includes(h.id)) : undefined;
    const keep = store.currentHousehold ? list.find((h) => h.id === store.currentHousehold!.id) : undefined;
    const current = newcomer ?? keep ?? list.find((h) => h.id === stored) ?? list[0];
    store.setHouseholds(list, current);
    if (current) void setStoredHouseholdId(current.id);
    if (!opts.silent) store.setBootError(false);
    return true;
  } catch (e) {
    // silent: 앱을 쓰는 중에 하는 백그라운드 갱신 — 일시 오류로 전체 화면을 오류로 바꾸지 않는다
    if (!opts.silent && isTransientError(e)) store.setBootError(true);
    return false;
  }
}

export async function selectHousehold(id: number): Promise<void> {
  const store = useAuthStore.getState();
  const h = store.households.find((x) => x.id === id);
  if (!h) return;
  store.setCurrentHousehold(h);
  await setStoredHouseholdId(id);
}

/** 앱 시작 시 저장된 토큰으로 세션 복원. 로그인 정보가 틀린 게 아니라 서버에 못 닿은 경우엔 로그인 화면 대신 재시도 화면 */
export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState();
  store.setBootError(false);
  try {
    const { accessToken, refreshToken } = await getTokens();
    if (accessToken && refreshToken) {
      const { data: res } = await api.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      const latest = await getTokens();
      store.setAuth({ accessToken: latest.accessToken ?? accessToken, refreshToken: latest.refreshToken ?? refreshToken }, res.data ?? res);
      await loadHouseholds();
    }
  } catch (e) {
    // 401(만료·무효)는 api 인터셉터가 토큰을 정리하고 로그아웃 처리 → 로그인 화면. 그 외 일시 오류만 재시도 화면.
    if (isTransientError(e)) store.setBootError(true);
  } finally {
    useAuthStore.getState().setReady();
  }
}

/** 재시도 버튼 — 세션이 이미 복원돼 있으면 가구만, 아니면 처음부터 */
export async function retryBoot(): Promise<void> {
  if (useAuthStore.getState().isAuthenticated) {
    await loadHouseholds();
  } else {
    await restoreSession();
  }
}
