import { Module } from '@nestjs/common';
import { FilesModule } from '@shared/files/files.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [FilesModule],
  controllers: [UploadsController],
})
export class JipUploadsModule {}
