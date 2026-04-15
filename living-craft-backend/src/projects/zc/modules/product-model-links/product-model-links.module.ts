import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModelLink } from './entities/product-model-link.entity';
import { ProductModelLinksService } from './product-model-links.service';
import { ProductModelLinksController } from './product-model-links.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductModelLink])],
  controllers: [ProductModelLinksController],
  providers: [ProductModelLinksService],
  exports: [ProductModelLinksService],
})
export class ProductModelLinksModule {}
