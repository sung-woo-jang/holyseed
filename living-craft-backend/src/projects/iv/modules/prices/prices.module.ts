import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IvPrice } from '../../entities/iv-price.entity'
import { IvState } from '../../entities/iv-state.entity'
import { PricesController } from './prices.controller'
import { PricesService } from './prices.service'

@Module({
  imports: [TypeOrmModule.forFeature([IvPrice, IvState])],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
