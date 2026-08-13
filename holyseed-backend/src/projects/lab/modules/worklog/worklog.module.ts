import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from '@shared/files/files.module';
import { Worklog, WorklogJobOption, WorklogCategoryOption } from './entities';
import { WorklogService } from './worklog.service';
import { WorklogController } from './worklog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Worklog, WorklogJobOption, WorklogCategoryOption]), FilesModule],
  controllers: [WorklogController],
  providers: [WorklogService],
  exports: [WorklogService],
})
export class WorklogModule {}
