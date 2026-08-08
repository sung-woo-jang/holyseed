import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 토큰이 있으면 검증해서 req.user를 채우고, 없거나 유효하지 않아도 요청을 막지 않는다.
 * @Public() 라우트에서 "토큰이 있으면 관리자 권한도 함께 처리"하고 싶을 때 사용.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // 토큰이 없거나 유효하지 않아도 요청은 계속 진행 (req.user만 비워둠)
    }
    return true;
  }

  handleRequest(err: any, user: any) {
    return user; // 기본 구현과 달리 여기서 throw하지 않음
  }
}
