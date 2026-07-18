import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaofusController } from './laofus.controller';
import { TossClientService } from './services/toss-client.service';
import { LaofusEngineService } from './services/engine.service';
import { LaofusStatusService } from './services/status.service';
import { LaofusSchedulerService } from './services/scheduler.service';
import { LaofusEngineState } from './entities/engine-state.entity';
import { LaofusCycle } from './entities/cycle.entity';
import { LaofusTrade } from './entities/trade.entity';
import { LaofusEvent } from './entities/event.entity';
import { LaofusPendingOrder } from './entities/pending-order.entity';

/**
 * SOXL 소수점 무한매수법 자동매매 (/api/laofus/*)
 * - 토스증권 Open API 연동, laofus DB 스키마가 상태 원장
 * - 스케줄러가 미국 장마감 30분 전(KST 04:30/05:30) LOC 에뮬레이션 실행
 * - 방법론 문서: docs/laofus/
 */
@Module({
  imports: [TypeOrmModule.forFeature([LaofusEngineState, LaofusCycle, LaofusTrade, LaofusEvent, LaofusPendingOrder])],
  controllers: [LaofusController],
  providers: [TossClientService, LaofusEngineService, LaofusStatusService, LaofusSchedulerService],
})
export class LaofusModule {}
