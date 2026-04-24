import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMatchingController } from './product-matching.controller';
import { ProductMatchingService } from './product-matching.service';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { ProductModel } from '../product-models/entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductListing, ProductModel, ProductModelLink])],
  controllers: [ProductMatchingController],
  providers: [ProductMatchingService],
  exports: [ProductMatchingService],
})
export class ProductMatchingModule {}
