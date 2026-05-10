import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetSnapshot } from '../asset-snapshots/entities/asset-snapshot.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetSnapshot, Transaction, Membership])],
  controllers: [DashboardController],
  providers: [DashboardService, MembershipGuard],
})
export class DashboardModule {}
