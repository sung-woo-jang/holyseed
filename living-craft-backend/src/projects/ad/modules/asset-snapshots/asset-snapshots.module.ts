import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetSnapshot } from './entities/asset-snapshot.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { AssetSnapshotsService } from './asset-snapshots.service';
import { AssetSnapshotsController } from './asset-snapshots.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AssetSnapshot, Membership])],
  controllers: [AssetSnapshotsController],
  providers: [AssetSnapshotsService, MembershipGuard],
  exports: [AssetSnapshotsService],
})
export class AssetSnapshotsModule {}
