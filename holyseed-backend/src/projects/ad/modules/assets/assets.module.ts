import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { MembershipGuard } from '../../common/guards/membership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Membership])],
  controllers: [AssetsController],
  providers: [AssetsService, MembershipGuard],
  exports: [AssetsService],
})
export class AssetsModule {}
