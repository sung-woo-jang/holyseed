import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobPhoto } from './entities/job-photo.entity';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JipAuthModule } from '../auth/jip-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobPhoto]), JipAuthModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
