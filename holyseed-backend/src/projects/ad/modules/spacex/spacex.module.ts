import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TossModule } from '@shared/toss/toss.module';
import { DcaPlan, SpacexEntry } from './entities';
import { SpacexService } from './spacex.service';
import { SpacexSchedulerService } from './spacex-scheduler.service';
import { SpacexController } from './spacex.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SpacexEntry, DcaPlan]), TossModule],
  controllers: [SpacexController],
  providers: [SpacexService, SpacexSchedulerService],
  exports: [SpacexService],
})
export class SpacexModule {}
