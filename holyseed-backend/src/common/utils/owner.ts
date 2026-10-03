/**
 * 소유자 판별 — AD 계정은 누구나 가입할 수 있어서(이메일·구글 첫 로그인) VR·라오어·근무일지처럼
 * 개인 영역은 소유자 계정만 쓰게 한다.
 *
 * - OWNER_USER_ID: 계정 번호(쉼표로 여러 개). 이메일은 인증 없이 가입돼서 선점 위험이 있어 번호가 기본.
 * - 비어 있으면 MCP_OWNER_EMAIL과 일치하는 이메일을 폴백으로 인정(기존 MCP 설정 그대로).
 * - OWNER_ONLY=false 면 검사를 끈다 (롤아웃·비상 해제용). 둘 다 비어 있으면 모두 거부(fail-closed).
 */
export interface OwnerCandidate {
  userId?: string | number;
  email?: string | null;
  aud?: string;
}

export function ownerEnforced(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.OWNER_ONLY !== 'false';
}

export function isOwner(user: OwnerCandidate | undefined | null, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!user || user.aud !== 'ad') return false;
  const ids = (env.OWNER_USER_ID ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length > 0) return user.userId != null && ids.includes(String(user.userId));
  const email = (env.MCP_OWNER_EMAIL ?? '').trim().toLowerCase();
  return !!email && !!user.email && user.email.toLowerCase() === email;
}
