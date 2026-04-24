import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { ProductModel } from '../product-models/entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { Brand } from '../brands/entities/brand.entity';
import { PriceHistory } from '../price-history/entities/price-history.entity';

export interface StatsOverviewDto {
  totalProducts: number;
  matchedProducts: number;
  unmatchedProducts: number;
  totalModels: number;
  totalBrands: number;
  recentPriceUpdates: {
    id: string;
    productName: string;
    siteName: string;
    price: number;
    discountPrice: number | null;
    recordedAt: Date;
  }[];
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(ProductListing)
    private readonly listingRepository: Repository<ProductListing>,
    @InjectRepository(ProductModel)
    private readonly modelRepository: Repository<ProductModel>,
    @InjectRepository(ProductModelLink)
    private readonly linkRepository: Repository<ProductModelLink>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  async getOverview(): Promise<StatsOverviewDto> {
    // 총 제품 수
    const totalProducts = await this.listingRepository.count({
      where: { isAvailable: true },
    });

    // 매칭된 제품 수
    const matchedProducts = await this.linkRepository.count();

    // 미매칭 제품 수
    const unmatchedProducts = totalProducts - matchedProducts;

    // 총 모델 수
    const totalModels = await this.modelRepository.count();

    // 총 브랜드 수
    const totalBrands = await this.brandRepository.count();

    // 최근 가격 업데이트 (최근 10개)
    const recentPriceUpdates = await this.priceHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.listing', 'listing')
      .leftJoinAndSelect('listing.site', 'site')
      .orderBy('history.recordedAt', 'DESC')
      .limit(10)
      .getMany();

    return {
      totalProducts,
      matchedProducts,
      unmatchedProducts,
      totalModels,
      totalBrands,
      recentPriceUpdates: recentPriceUpdates.map((item) => ({
        id: item.id,
        productName: item.listing?.productName || '알 수 없음',
        siteName: item.listing?.site?.name || '알 수 없음',
        price: item.price,
        discountPrice: item.discountPrice,
        recordedAt: item.recordedAt,
      })),
    };
  }
}
