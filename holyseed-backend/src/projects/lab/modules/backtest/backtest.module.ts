import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TossModule } from '@shared/toss/toss.module';
import { BacktestPrice } from './entities';
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BacktestPrice]), TossModule],
  controllers: [BacktestController],
  providers: [BacktestService],
})
export class BacktestModule {}
