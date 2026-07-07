/** axios 에러에서 백엔드 한국어 메시지 추출 — 없으면 fallback ("Request failed with..." 영어 노출 방지) */
export function getErrorMessage(e: unknown, fallback: string): string {
  const msg = (e as any)?.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length) return String(msg[0]);
  return fallback;
}
