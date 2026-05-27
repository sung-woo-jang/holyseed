import { Module } from '@nestjs/common';
import { FilesModule } from '@shared/files/files.module';
import { CatalogModule } from '../catalog/catalog.module';
import { SiteAssetsModule } from '../site-assets/site-assets.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [FilesModule, CatalogModule, SiteAssetsModule],
  controllers: [UploadsController],
})
export class JipUploadsModule {}
