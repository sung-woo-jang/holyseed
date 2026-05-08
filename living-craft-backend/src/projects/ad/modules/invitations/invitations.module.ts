import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { Household } from '../households/entities/household.entity';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, Membership, Household])],
  controllers: [InvitationsController],
  providers: [InvitationsService, MembershipGuard],
  exports: [InvitationsService],
})
export class InvitationsModule {}
