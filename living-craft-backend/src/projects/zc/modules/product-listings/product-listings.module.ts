import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductListing } from './entities/product-listing.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { ProductListingsService } from './product-listings.service';
import { ProductListingsController } from './product-listings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductListing, ProductModelLink])],
  controllers: [ProductListingsController],
  providers: [ProductListingsService],
  exports: [ProductListingsService],
})
export class ProductListingsModule {}
