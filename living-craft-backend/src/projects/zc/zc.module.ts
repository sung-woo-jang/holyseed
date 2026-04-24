import { Module } from '@nestjs/common';
import { SitesModule } from './modules/sites/sites.module';
import { SiteCategoriesModule } from './modules/site-categories/site-categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductListingsModule } from './modules/product-listings/product-listings.module';
import { ProductModelsModule } from './modules/product-models/product-models.module';
import { ProductModelLinksModule } from './modules/product-model-links/product-model-links.module';
import { ProductImagesModule } from './modules/product-images/product-images.module';
import { PriceHistoryModule } from './modules/price-history/price-history.module';
import { ProductMatchingModule } from './modules/product-matching/product-matching.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { StatsModule } from './modules/stats/stats.module';

/**
 * ZC 프로젝트 모듈
 * - 전자제품 가격 비교 서비스
 * - Dasis 등 사이트 크롤링 데이터 제공
 * - 모든 컨트롤러에 zc/ prefix 적용됨 (/api/zc/*)
 */
@Module({
  imports: [
    // Core modules
    SitesModule,
    SiteCategoriesModule,
    BrandsModule,

    // Product modules
    ProductListingsModule,
    ProductModelsModule,
    ProductModelLinksModule,
    ProductImagesModule,

    // Product matching
    ProductMatchingModule,

    // Quotes
    QuotesModule,

    // Price tracking
    PriceHistoryModule,

    // Statistics
    StatsModule,
  ],
  exports: [
    SiteCategoriesModule,
    ProductListingsModule,
    BrandsModule,
    PriceHistoryModule,
  ],
})
export class ZcModule {}
