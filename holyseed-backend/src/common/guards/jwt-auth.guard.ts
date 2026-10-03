import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, OWNER_ONLY_KEY, type OwnerOnlyOptions } from '@common/decorators';
import { isOwner, ownerEnforced } from '@common/utils/owner';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    if (isPublic) {
      return true;
    }

    const ownerOnly = this.reflector.getAllAndOverride<OwnerOnlyOptions | undefined>(OWNER_ONLY_KEY, targets);
    const enforced = ownerEnforced();

    // 롤아웃 단계: 예전부터 공개였던 엔드포인트는 익명 호출을 계속 허용 (앱 업데이트 전 기기 보호)
    if (ownerOnly?.legacyPublic && !enforced) {
      return true;
    }

    const authenticated = (await super.canActivate(context)) as boolean;
    if (!authenticated || !ownerOnly || !enforced) {
      return authenticated;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!isOwner(user)) {
      throw new ForbiddenException('소유자 계정만 사용할 수 있어요.');
    }
    return true;
  }
}
