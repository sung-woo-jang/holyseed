import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

/**
 * laofus 전용 간이 인증 — X-Laofus-Key 헤더가 LAOFUS_API_KEY와 일치해야 통과.
 * LAOFUS_API_KEY 미설정 시에도 거부(fail-closed) — 매매 트리거(POST /run)가
 * 실수로 무인증 노출되는 것을 막기 위함.
 */
@Injectable()
export class LaofusKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = process.env.LAOFUS_API_KEY;
    if (!required) {
      throw new UnauthorizedException('LAOFUS_API_KEY가 설정되지 않았습니다');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-laofus-key'];
    if (typeof key === 'string' && this.constantTimeEqual(key, required)) return true;
    throw new UnauthorizedException('X-Laofus-Key 헤더가 올바르지 않습니다');
  }

  private constantTimeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
