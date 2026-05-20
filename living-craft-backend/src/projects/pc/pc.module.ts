import { Module } from '@nestjs/common';
import { PcAuthModule } from './modules/auth/pc-auth.module';
import { PcCategoriesModule } from './modules/categories/categories.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ProductsModule } from './modules/products/products.module';
import { PricesModule } from './modules/prices/prices.module';

@Module({
  imports: [
    PcAuthModule,
    PcCategoriesModule,
    VendorsModule,
    ProductsModule,
    PricesModule,
  ],
})
export class PcModule {}
