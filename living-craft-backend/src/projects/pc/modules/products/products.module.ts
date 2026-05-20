import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductPrice } from '../prices/entities/product-price.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { PcCategory } from '../categories/entities/category.entity';
import { ProductsService } from './products.service';
import { ProductImagesService } from './product-images.service';
import { ProductsController } from './products.controller';
import { ProductImagesController } from './product-images.controller';
import { CategoriesService } from '../categories/categories.service';
import { PricesService } from '../prices/prices.service';
import { FilesModule } from '@shared/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductPrice, Vendor, PcCategory]),
    FilesModule,
  ],
  controllers: [ProductsController, ProductImagesController],
  providers: [ProductsService, ProductImagesService, CategoriesService, PricesService],
  exports: [ProductsService],
})
export class ProductsModule {}
