import { Module } from '@nestjs/common'
import { IvAuthModule } from './modules/auth/auth.module'
import { StrategiesModule } from './modules/strategies/strategies.module'
import { PlansModule } from './modules/plans/plans.module'
import { ExecutionsModule } from './modules/executions/executions.module'
import { PricesModule } from './modules/prices/prices.module'
import { CyclesModule } from './modules/cycles/cycles.module'

@Module({
  imports: [
    IvAuthModule,
    StrategiesModule,
    PlansModule,
    ExecutionsModule,
    PricesModule,
    CyclesModule,
  ],
})
export class IvModule {}
