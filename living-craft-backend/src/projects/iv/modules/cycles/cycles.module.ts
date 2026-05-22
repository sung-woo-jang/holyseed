import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { CyclesController } from './cycles.controller'
import { CyclesService } from './cycles.service'

@Module({
  imports: [TypeOrmModule.forFeature([IvState, IvStrategy])],
  controllers: [CyclesController],
  providers: [CyclesService],
  exports: [CyclesService],
})
export class CyclesModule {}
