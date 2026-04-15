import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceHistory } from './entities/price-history.entity';

@Injectable()
export class PriceHistoryService {
  constructor(
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  async findByListingId(listingId: string): Promise<PriceHistory[]> {
    return await this.priceHistoryRepository.find({
      where: { listingId },
      order: { recordedAt: 'DESC' },
    });
  }

  async findByListingIdAndDateRange(
    listingId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PriceHistory[]> {
    return await this.priceHistoryRepository
      .createQueryBuilder('ph')
      .where('ph.listingId = :listingId', { listingId })
      .andWhere('ph.recordedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('ph.recordedAt', 'ASC')
      .getMany();
  }

  async create(
    listingId: string,
    price: number,
    discountPrice: number | null,
    isAvailable: boolean = true,
  ): Promise<PriceHistory> {
    const priceHistory = this.priceHistoryRepository.create({
      listingId,
      price,
      discountPrice,
      recordedAt: new Date(),
      isAvailable,
    });

    return await this.priceHistoryRepository.save(priceHistory);
  }

  /**
   * 최근 가격 변동 제품 조회
   */
  async findRecentChanges(days: number = 7, limit: number = 20): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentChanges = await this.priceHistoryRepository
      .createQueryBuilder('ph')
      .leftJoinAndSelect('ph.listing', 'listing')
      .leftJoinAndSelect('listing.siteCategory', 'category')
      .leftJoinAndSelect('listing.brand', 'brand')
      .where('ph.recordedAt >= :startDate', { startDate })
      .orderBy('ph.recordedAt', 'DESC')
      .limit(limit)
      .getMany();

    return recentChanges.map((ph) => ({
      id: ph.id,
      listingId: ph.listingId,
      price: ph.price,
      discountPrice: ph.discountPrice,
      recordedAt: ph.recordedAt,
      product: ph.listing
        ? {
            id: ph.listing.id,
            productName: ph.listing.productName,
            currentPrice: ph.listing.currentPrice,
            currentDiscountPrice: ph.listing.currentDiscountPrice,
            category: ph.listing.siteCategory?.name,
            brand: ph.listing.brand?.name,
          }
        : null,
    }));
  }
}
