import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '@shared/files/files.module';
import { Worklog, WorklogJobOption } from './entities';
import { WorklogService } from './worklog.service';
import { WorklogController } from './worklog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Worklog, WorklogJobOption]), FilesModule],
  controllers: [WorklogController],
  providers: [WorklogService],
  exports: [WorklogService],
})
export class WorklogModule {}
