import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from './entities/household.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { AdUser } from '../users/entities/ad-user.entity';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Household, Membership, AdUser])],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, MembershipGuard],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
