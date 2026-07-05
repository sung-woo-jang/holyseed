const KEY_ACCESS = '@ad:accessToken';
const KEY_REFRESH = '@ad:refreshToken';

// 원본(Apps-in-Toss Storage)과 async 시그니처를 유지해 호출부 무수정 이식
export async function getTokens() {
  return {
    accessToken: localStorage.getItem(KEY_ACCESS),
    refreshToken: localStorage.getItem(KEY_REFRESH),
  };
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(KEY_ACCESS, accessToken);
  localStorage.setItem(KEY_REFRESH, refreshToken);
}

export async function clearTokens() {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
}
