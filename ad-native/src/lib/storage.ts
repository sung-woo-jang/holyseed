import * as SecureStore from 'expo-secure-store';

const KEY_ACCESS = 'ad_accessToken';
const KEY_REFRESH = 'ad_refreshToken';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEY_ACCESS),
    SecureStore.getItemAsync(KEY_REFRESH),
  ]);
  return { accessToken, refreshToken };
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([SecureStore.deleteItemAsync(KEY_ACCESS), SecureStore.deleteItemAsync(KEY_REFRESH)]);
}
