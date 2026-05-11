import { Storage } from '@apps-in-toss/framework';

const KEY_ACCESS = '@ad:accessToken';
const KEY_REFRESH = '@ad:refreshToken';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    Storage.getItem(KEY_ACCESS),
    Storage.getItem(KEY_REFRESH),
  ]);
  return { accessToken, refreshToken };
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    Storage.setItem(KEY_ACCESS, accessToken),
    Storage.setItem(KEY_REFRESH, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([Storage.removeItem(KEY_ACCESS), Storage.removeItem(KEY_REFRESH)]);
}
