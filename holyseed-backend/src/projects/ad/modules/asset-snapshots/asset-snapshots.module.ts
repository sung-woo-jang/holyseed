import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetSnapshot } from './entities/asset-snapshot.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { AssetSnapshotsService } from './asset-snapshots.service';
import { AssetSnapshotsController } from './asset-snapshots.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AssetSnapshot, Asset, Membership])],
  controllers: [AssetSnapshotsController],
  providers: [AssetSnapshotsService, MembershipGuard],
  exports: [AssetSnapshotsService],
})
export class AssetSnapshotsModule {}
