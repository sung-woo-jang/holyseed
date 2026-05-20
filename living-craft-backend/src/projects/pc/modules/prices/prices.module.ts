import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductPrice } from './entities/product-price.entity';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductPrice])],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
