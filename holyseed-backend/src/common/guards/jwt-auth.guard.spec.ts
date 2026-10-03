import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY, OWNER_ONLY_KEY } from '@common/decorators';

function ctx(user: unknown): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardWith(meta: Record<string, unknown>, jwtOk = true) {
  const reflector = { getAllAndOverride: (key: string) => meta[key] } as unknown as Reflector;
  const guard = new JwtAuthGuard(reflector);
  const base = Object.getPrototypeOf(JwtAuthGuard.prototype) as object;
  jest.spyOn(base as any, 'canActivate').mockResolvedValue(jwtOk);
  return guard;
}

describe('JwtAuthGuard (소유자 전용)', () => {
  const OLD = { ...process.env };
  beforeEach(() => {
    process.env.OWNER_USER_ID = '1';
    delete process.env.OWNER_ONLY;
  });
  afterEach(() => {
    process.env = { ...OLD };
    jest.restoreAllMocks();
  });

  it('@Public은 그대로 통과', async () => {
    await expect(guardWith({ [IS_PUBLIC_KEY]: true }).canActivate(ctx(undefined))).resolves.toBe(true);
  });

  it('OwnerOnly: 소유자는 통과, 다른 가입자는 403', async () => {
    const meta = { [OWNER_ONLY_KEY]: {} };
    await expect(guardWith(meta).canActivate(ctx({ userId: 1, aud: 'ad' }))).resolves.toBe(true);
    await expect(guardWith(meta).canActivate(ctx({ userId: 2, aud: 'ad' }))).rejects.toThrow(ForbiddenException);
  });

  it('OwnerOnly: JWT 자체가 무효면 소유자 검사 전에 거부', async () => {
    await expect(guardWith({ [OWNER_ONLY_KEY]: {} }, false).canActivate(ctx(undefined))).resolves.toBe(false);
  });

  it('legacyPublic은 OWNER_ONLY=false(롤아웃)일 때만 익명 허용', async () => {
    const meta = { [OWNER_ONLY_KEY]: { legacyPublic: true } };
    process.env.OWNER_ONLY = 'false';
    await expect(guardWith(meta).canActivate(ctx(undefined))).resolves.toBe(true);
    delete process.env.OWNER_ONLY;
    await expect(guardWith(meta, false).canActivate(ctx(undefined))).resolves.toBe(false);
  });

  it('OWNER_ONLY=false 이면 소유자 검사 없이 JWT만 확인(비소유자도 통과)', async () => {
    process.env.OWNER_ONLY = 'false';
    await expect(guardWith({ [OWNER_ONLY_KEY]: {} }).canActivate(ctx({ userId: 2, aud: 'ad' }))).resolves.toBe(true);
  });

  it('OwnerOnly 표시가 없는 라우트는 JWT만 확인', async () => {
    await expect(guardWith({}).canActivate(ctx({ userId: 2, aud: 'ad' }))).resolves.toBe(true);
  });
});
