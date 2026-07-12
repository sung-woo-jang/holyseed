import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '../../modules/memberships/entities/membership.entity';

export const REQUIRE_MEMBERSHIP_KEY = 'requireMembership';

export interface RequireMembershipOptions {
  minRole?: MemberRole.EDITOR | MemberRole.OWNER;
}

export const RequireMembership = (options: RequireMembershipOptions = {}) =>
  SetMetadata(REQUIRE_MEMBERSHIP_KEY, options);
