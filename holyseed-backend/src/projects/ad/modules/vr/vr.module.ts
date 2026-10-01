import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TossModule } from '@shared/toss/toss.module';
import { LaofusEngineState } from '@/projects/laofus/entities/engine-state.entity';
import { LaofusAccountSnapshot } from '@/projects/laofus/entities/account-snapshot.entity';
import { VrSetting, VrCycle, VrFill, VrEvent, VrPendingOrder } from './entities';
import { VrService } from './vr.service';
import { VrController } from './vr.controller';
import { VrEngineService } from './services/vr-engine.service';
import { VrSchedulerService } from './services/vr-scheduler.service';
import { VrStatusService } from './services/vr-status.service';
import { VrPerformanceService } from './services/vr-performance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VrSetting,
      VrCycle,
      VrFill,
      VrEvent,
      VrPendingOrder,
      LaofusEngineState,
      LaofusAccountSnapshot,
    ]),
    TossModule,
  ],
  controllers: [VrController],
  providers: [VrService, VrEngineService, VrSchedulerService, VrStatusService, VrPerformanceService],
})
export class VrModule {}
