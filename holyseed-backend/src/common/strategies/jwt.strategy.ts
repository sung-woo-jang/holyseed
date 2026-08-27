import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  coupleId?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

const PROJECT_PREFIXES: Record<string, string> = {
  '/api/ad': 'ad',
  '/api/wedding': 'wedding',
  '/api/lab': 'lab',
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const matchedPrefix = Object.keys(PROJECT_PREFIXES).find((prefix) => req.path.startsWith(prefix));
    // /api/lab은 1인 개인 도구라 ad-native(같은 소유자의 ad 토큰)도 허용 — lab 쪽은 사용자별 데이터 격리를
    // 거의 안 하므로 안전(예외: worklog sort-pref 2개 엔드포인트뿐, ad-native는 호출하지 않음)
    const allowedAud = matchedPrefix === '/api/lab' ? ['lab', 'ad'] : matchedPrefix ? [PROJECT_PREFIXES[matchedPrefix]] : null;
    if (allowedAud && !allowedAud.includes(payload.aud ?? '')) {
      throw new UnauthorizedException('다른 프로젝트에서 발급된 토큰입니다.');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role, coupleId: payload.coupleId };
  }
}
