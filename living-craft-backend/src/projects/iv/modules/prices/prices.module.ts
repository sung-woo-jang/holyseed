import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IvPrice } from '../../entities/iv-price.entity'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { PricesController } from './prices.controller'
import { PricesService } from './prices.service'
import { PlansModule } from '../plans/plans.module'

@Module({
  imports: [TypeOrmModule.forFeature([IvPrice, IvState, IvStrategy]), PlansModule],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
