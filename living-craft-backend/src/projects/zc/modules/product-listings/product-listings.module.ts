import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductListing } from './entities/product-listing.entity';
import { ProductListingsService } from './product-listings.service';
import { ProductListingsController } from './product-listings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductListing])],
  controllers: [ProductListingsController],
  providers: [ProductListingsService],
  exports: [ProductListingsService],
})
export class ProductListingsModule {}
