import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImage } from './entities/product-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage])],
  exports: [TypeOrmModule],
})
export class ProductImagesModule {}
