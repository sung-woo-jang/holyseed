import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { ComparisonService } from './comparison.service';
import { ComparisonController } from './comparison.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Membership])],
  controllers: [ComparisonController],
  providers: [ComparisonService, MembershipGuard],
})
export class ComparisonModule {}
