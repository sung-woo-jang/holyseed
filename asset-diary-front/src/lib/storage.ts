import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCESS = '@ad:accessToken';
const KEY_REFRESH = '@ad:refreshToken';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(KEY_ACCESS),
    AsyncStorage.getItem(KEY_REFRESH),
  ]);
  return { accessToken, refreshToken };
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    AsyncStorage.setItem(KEY_ACCESS, accessToken),
    AsyncStorage.setItem(KEY_REFRESH, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([AsyncStorage.removeItem(KEY_ACCESS), AsyncStorage.removeItem(KEY_REFRESH)]);
}
