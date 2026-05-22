import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IvExecution } from '../../entities/iv-execution.entity'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvDailyPlan } from '../../entities/iv-daily-plan.entity'
import { ExecutionsController } from './executions.controller'
import { ExecutionsService } from './executions.service'

@Module({
  imports: [TypeOrmModule.forFeature([IvExecution, IvState, IvStrategy, IvDailyPlan])],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
