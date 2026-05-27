import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteAsset } from './entities/site-asset.entity';
import { SiteAssetsService } from './site-assets.service';
import { SiteAssetsController } from './site-assets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteAsset])],
  controllers: [SiteAssetsController],
  providers: [SiteAssetsService],
  exports: [SiteAssetsService],
})
export class SiteAssetsModule {}
