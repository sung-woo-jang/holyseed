import { isOwner, ownerEnforced } from './owner';

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe('owner', () => {
  it('OWNER_USER_ID에 있는 ad 계정만 소유자', () => {
    const e = env({ OWNER_USER_ID: '1, 7' });
    expect(isOwner({ userId: 1, aud: 'ad' }, e)).toBe(true);
    expect(isOwner({ userId: '7', aud: 'ad' }, e)).toBe(true);
    expect(isOwner({ userId: 2, aud: 'ad' }, e)).toBe(false);
  });

  it('다른 프로젝트(wedding·fridge) 토큰은 계정 번호가 같아도 거부', () => {
    expect(isOwner({ userId: 1, aud: 'fridge' }, env({ OWNER_USER_ID: '1' }))).toBe(false);
    expect(isOwner({ userId: 1 }, env({ OWNER_USER_ID: '1' }))).toBe(false);
  });

  it('계정 번호가 없으면 MCP_OWNER_EMAIL(대소문자 무시)로 폴백', () => {
    const e = env({ MCP_OWNER_EMAIL: 'Owner@Example.com' });
    expect(isOwner({ userId: 9, email: 'owner@example.com', aud: 'ad' }, e)).toBe(true);
    expect(isOwner({ userId: 9, email: 'other@example.com', aud: 'ad' }, e)).toBe(false);
  });

  it('계정 번호가 설정돼 있으면 이메일이 같아도 번호가 다르면 거부', () => {
    const e = env({ OWNER_USER_ID: '1', MCP_OWNER_EMAIL: 'owner@example.com' });
    expect(isOwner({ userId: 2, email: 'owner@example.com', aud: 'ad' }, e)).toBe(false);
  });

  it('둘 다 비어 있으면 모두 거부(fail-closed)', () => {
    expect(isOwner({ userId: 1, email: 'a@b.c', aud: 'ad' }, env({}))).toBe(false);
    expect(isOwner(undefined, env({ OWNER_USER_ID: '1' }))).toBe(false);
  });

  it('OWNER_ONLY=false 일 때만 검사 해제', () => {
    expect(ownerEnforced(env({}))).toBe(true);
    expect(ownerEnforced(env({ OWNER_ONLY: 'true' }))).toBe(true);
    expect(ownerEnforced(env({ OWNER_ONLY: 'false' }))).toBe(false);
  });
});
