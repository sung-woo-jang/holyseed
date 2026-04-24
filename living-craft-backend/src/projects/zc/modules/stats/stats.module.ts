import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { ProductModel } from '../product-models/entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { Brand } from '../brands/entities/brand.entity';
import { PriceHistory } from '../price-history/entities/price-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductListing, ProductModel, ProductModelLink, Brand, PriceHistory]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
