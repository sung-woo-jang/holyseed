const KEY_ACCESS = '@lab:accessToken'
const KEY_REFRESH = '@lab:refreshToken'

export async function getTokens() {
  return {
    accessToken: localStorage.getItem(KEY_ACCESS),
    refreshToken: localStorage.getItem(KEY_REFRESH),
  }
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(KEY_ACCESS, accessToken)
  localStorage.setItem(KEY_REFRESH, refreshToken)
}

export async function clearTokens() {
  localStorage.removeItem(KEY_ACCESS)
  localStorage.removeItem(KEY_REFRESH)
}
