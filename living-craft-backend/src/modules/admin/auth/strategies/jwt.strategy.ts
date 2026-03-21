import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from '@common/interfaces';
import { UsersService } from '@modules/admin/users/users.service';
import { UserStatus } from '@common/enums';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: IJwtPayload) {
    // payload에서 사용자 ID 추출
    const user = await this.usersService.findUserByUuid(payload.sub);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.UNAUTHORIZED_USER);
    }

    // 사용자 상태 확인
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_INACTIVE);
    }

    // request.user에 저장될 데이터
    return {
      sub: user.uuid,
      email: user.email,
      role: user.role,
    };
  }
}
