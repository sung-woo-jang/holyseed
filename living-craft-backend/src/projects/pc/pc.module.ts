import { Module } from '@nestjs/common';
import { PcCategoriesModule } from './modules/categories/categories.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ProductsModule } from './modules/products/products.module';
import { PricesModule } from './modules/prices/prices.module';
import { PcSequenceSyncService } from './pc-sequence-sync.service';

@Module({
  imports: [
    PcCategoriesModule,
    VendorsModule,
    ProductsModule,
    PricesModule,
  ],
  providers: [PcSequenceSyncService],
})
export class PcModule {}
