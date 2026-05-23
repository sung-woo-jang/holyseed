import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechSchedule } from './entities/tech-schedule.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TechSchedule])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class JipScheduleModule {}
