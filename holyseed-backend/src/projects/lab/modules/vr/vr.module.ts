import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TossModule } from '@shared/toss/toss.module';
import { LaofusEngineState } from '@/projects/laofus/entities/engine-state.entity';
import { VrSetting, VrCycle, VrFill, VrEvent, VrPendingOrder } from './entities';
import { VrService } from './vr.service';
import { VrController } from './vr.controller';
import { VrEngineService } from './services/vr-engine.service';
import { VrSchedulerService } from './services/vr-scheduler.service';
import { VrStatusService } from './services/vr-status.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VrSetting, VrCycle, VrFill, VrEvent, VrPendingOrder, LaofusEngineState]),
    TossModule,
  ],
  controllers: [VrController],
  providers: [VrService, VrEngineService, VrSchedulerService, VrStatusService],
})
export class VrModule {}
