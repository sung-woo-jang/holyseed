import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUIRE_MEMBERSHIP_KEY, RequireMembershipOptions } from '../decorators/require-membership.decorator';
import { Membership, MemberRole } from '../../modules/memberships/entities/membership.entity';

const ROLE_WEIGHT: Record<MemberRole, number> = {
  [MemberRole.VIEWER]: 1,
  [MemberRole.EDITOR]: 2,
  [MemberRole.OWNER]: 3,
};

@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RequireMembershipOptions | undefined>(REQUIRE_MEMBERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const userId: number = request.user?.userId;

    const householdId = this.extractHouseholdId(request);
    if (!householdId) return true;

    const membership = await this.membershipRepo.findOne({
      where: { householdId, userId },
    });

    if (!membership) {
      throw new NotFoundException('해당 가구의 멤버가 아닙니다.');
    }

    const required = options.minRole ?? MemberRole.VIEWER;
    if (ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[required]) {
      throw new ForbiddenException(`${required} 이상의 권한이 필요합니다.`);
    }

    request.membership = membership;
    return true;
  }

  private extractHouseholdId(request: any): number | null {
    const id = request.params?.householdId ?? request.params?.id ?? request.body?.householdId;
    return id ? Number(id) : null;
  }
}
