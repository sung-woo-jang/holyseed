import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceHistory } from './entities/price-history.entity';
import { PriceHistoryService } from './price-history.service';
import { PriceHistoryController } from './price-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PriceHistory])],
  controllers: [PriceHistoryController],
  providers: [PriceHistoryService],
  exports: [PriceHistoryService],
})
export class PriceHistoryModule {}
