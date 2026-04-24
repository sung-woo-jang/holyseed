import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModel } from './entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { ProductModelsService } from './product-models.service';
import { ProductModelsController } from './product-models.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductModel, ProductModelLink, ProductListing])],
  controllers: [ProductModelsController],
  providers: [ProductModelsService],
  exports: [ProductModelsService],
})
export class ProductModelsModule {}
