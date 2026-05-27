import { Module } from '@nestjs/common';
import { PcCategoriesModule } from './modules/categories/categories.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ProductsModule } from './modules/products/products.module';
import { PricesModule } from './modules/prices/prices.module';

@Module({
  imports: [
    PcCategoriesModule,
    VendorsModule,
    ProductsModule,
    PricesModule,
  ],
})
export class PcModule {}
