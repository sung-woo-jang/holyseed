import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteCategory } from './entities/site-category.entity';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { SiteCategoriesService } from './site-categories.service';
import { SiteCategoriesController } from './site-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteCategory, ProductListing])],
  controllers: [SiteCategoriesController],
  providers: [SiteCategoriesService],
  exports: [SiteCategoriesService],
})
export class SiteCategoriesModule {}
