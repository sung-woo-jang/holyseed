import {
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators';
import { UsersService } from '@modules/admin/users/users.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. @Public() 데코레이터 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. 개발 환경에서는 인증 우회 (개발용 사용자 주입)
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'development') {
      const request = context.switchToHttp().getRequest();

      const user = await this.usersService.findDevUser();
      if (!user) {
        throw new InternalServerErrorException(
          '[DEV] 개발용 사용자를 찾을 수 없습니다.',
        );
      }

      // request.user 객체 설정 (RolesGuard 등에서 사용)
      request.user = {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        role: user.role,
      };

      console.log(
        `[DEV] JwtAuthGuard bypassed - injecting user: ${user.email}`,
      );
      return true;
    }

    // 3. 프로덕션 환경에서는 정상 JWT 검증
    return super.canActivate(context) as Promise<boolean>;
  }
}
