import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IvDailyPlan } from '../../entities/iv-daily-plan.entity'
import { IvExecution } from '../../entities/iv-execution.entity'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvPrice } from '../../entities/iv-price.entity'
import { PlansController } from './plans.controller'
import { PlansService } from './plans.service'

@Module({
  imports: [TypeOrmModule.forFeature([IvDailyPlan, IvState, IvStrategy, IvPrice, IvExecution])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
