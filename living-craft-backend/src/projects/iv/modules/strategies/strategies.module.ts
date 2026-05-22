import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvState } from '../../entities/iv-state.entity'
import { StrategiesController } from './strategies.controller'
import { StrategiesService } from './strategies.service'

@Module({
  imports: [TypeOrmModule.forFeature([IvStrategy, IvState])],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
