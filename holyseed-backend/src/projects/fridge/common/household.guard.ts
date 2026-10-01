import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FridgeHouseholdMember, FridgeRole } from '../entities';

export interface FridgeRequest {
  user: { userId: string };
  householdId: number;
  householdRole: FridgeRole;
}

/**
 * 토큰의 사용자 → 소속 가구를 찾아 req.householdId로 주입한다.
 * 가구가 없으면 항상 403 — 데코레이터가 없어도 통과시키지 않는다(fail-closed).
 */
@Injectable()
export class HouseholdGuard implements CanActivate {
  constructor(@InjectRepository(FridgeHouseholdMember) private readonly memberRepo: Repository<FridgeHouseholdMember>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FridgeRequest>();
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId)) throw new ForbiddenException('로그인이 필요합니다.');

    const member = await this.memberRepo.findOne({ where: { userId } });
    if (!member) throw new ForbiddenException('가구에 참여한 뒤 이용할 수 있어요.');

    req.householdId = member.householdId;
    req.householdRole = member.role;
    return true;
  }
}
