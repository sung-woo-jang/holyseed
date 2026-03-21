import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { NcpStorageService } from '@common/services/ncp-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [FilesService, NcpStorageService],
  controllers: [FilesController],
  exports: [FilesService, NcpStorageService],
})
export class FilesModule {}
