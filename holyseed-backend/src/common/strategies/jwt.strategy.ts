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
    if (matchedPrefix && payload.aud !== PROJECT_PREFIXES[matchedPrefix]) {
      throw new UnauthorizedException('다른 프로젝트에서 발급된 토큰입니다.');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role, coupleId: payload.coupleId };
  }
}
