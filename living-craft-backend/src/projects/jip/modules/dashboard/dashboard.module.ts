import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteRequest } from '../requests/entities/quote-request.entity';
import { Job } from '../jobs/entities/job.entity';
import { JobPhoto } from '../jobs/entities/job-photo.entity';
import { DashboardController } from './dashboard.controller';
import { JobsService } from '../jobs/jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, Job, JobPhoto])],
  controllers: [DashboardController],
  providers: [JobsService],
})
export class JipDashboardModule {}
