import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpacexEntry, SpacexState } from './entities';
import { SpacexService } from './spacex.service';
import { SpacexController } from './spacex.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SpacexEntry, SpacexState])],
  controllers: [SpacexController],
  providers: [SpacexService],
  exports: [SpacexService],
})
export class SpacexModule {}
