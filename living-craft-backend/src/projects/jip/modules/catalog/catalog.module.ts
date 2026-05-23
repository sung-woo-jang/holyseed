import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { ServiceItem } from './entities/service-item.entity';
import { ProductGroup } from './entities/product-group.entity';
import { Product } from './entities/product.entity';
import { ProductFeature } from './entities/product-feature.entity';
import { ProductColor } from './entities/product-color.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, ServiceItem, ProductGroup, Product, ProductFeature, ProductColor])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
