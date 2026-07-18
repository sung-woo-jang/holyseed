import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * laofus 전용 간이 인증 — LAOFUS_API_KEY 환경변수 설정 시 X-Laofus-Key 헤더 검증.
 * 미설정이면 통과 (로컬 개발). 매매 트리거(POST /run)가 공개 서버에 노출되는 것 방지 목적.
 */
@Injectable()
export class LaofusKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = process.env.LAOFUS_API_KEY;
    if (!required) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-laofus-key'] ?? req.query['key'];
    if (key === required) return true;
    throw new UnauthorizedException('X-Laofus-Key 헤더가 올바르지 않습니다');
  }
}
