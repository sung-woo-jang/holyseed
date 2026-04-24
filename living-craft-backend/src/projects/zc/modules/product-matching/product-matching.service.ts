import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { ProductModel } from '../product-models/entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { calculateSimilarity, containsString } from './utils/string-similarity';

@Injectable()
export class ProductMatchingService {
  // 자동 매칭 신뢰도 임계값 (0.8 이상이면 자동 매칭)
  private readonly CONFIDENCE_THRESHOLD = 0.8;

  constructor(
    @InjectRepository(ProductListing)
    private readonly productListingRepository: Repository<ProductListing>,
    @InjectRepository(ProductModel)
    private readonly productModelRepository: Repository<ProductModel>,
    @InjectRepository(ProductModelLink)
    private readonly productModelLinkRepository: Repository<ProductModelLink>,
  ) {}

  /**
   * 미매칭 Listing 조회
   */
  async findUnmatchedListings(): Promise<ProductListing[]> {
    // ProductModelLink에 존재하지 않는 Listing 조회
    const matchedListingIds = await this.productModelLinkRepository
      .createQueryBuilder('link')
      .select('link.listingId')
      .getRawMany()
      .then((results) => results.map((r) => r.link_listingId));

    const query = this.productListingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.brand', 'brand')
      .where('listing.extractedModelName IS NOT NULL');

    if (matchedListingIds.length > 0) {
      query.andWhere('listing.id NOT IN (:...ids)', { ids: matchedListingIds });
    }

    return await query.orderBy('listing.createdAt', 'DESC').getMany();
  }

  /**
   * 특정 Listing에 대한 자동 매칭 실행
   * @param listingId Listing ID
   * @returns 매칭 성공 시 ProductModelLink, 실패 시 null
   */
  async autoMatch(listingId: string): Promise<ProductModelLink | null> {
    const listing = await this.productListingRepository.findOne({
      where: { id: listingId },
      relations: ['brand'],
    });

    if (!listing || !listing.extractedModelName) {
      return null;
    }

    // 같은 브랜드의 모든 Product Model 조회
    const models = await this.productModelRepository.find({
      where: { brandId: listing.brandId },
    });

    if (models.length === 0) {
      return null;
    }

    // 가장 유사한 모델 찾기
    let bestMatch: ProductModel | null = null;
    let bestConfidence = 0;

    for (const model of models) {
      const similarity = calculateSimilarity(listing.extractedModelName, model.modelName);

      // 포함 관계도 확인 (보너스 점수)
      const containsBonus = containsString(listing.extractedModelName, model.modelName) ? 0.1 : 0;
      const confidence = Math.min(similarity + containsBonus, 1.0);

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = model;
      }
    }

    // 임계값 이상이면 자동 매칭
    if (bestMatch && bestConfidence >= this.CONFIDENCE_THRESHOLD) {
      const link = this.productModelLinkRepository.create({
        listingId: listing.id,
        modelId: bestMatch.id,
        matchType: 'auto_matched',
        matchConfidence: bestConfidence,
        linkedAt: new Date(),
        linkedBy: 'auto-matcher',
      });

      return await this.productModelLinkRepository.save(link);
    }

    return null;
  }

  /**
   * 모든 미매칭 Listing에 대해 자동 매칭 실행
   * @returns { matched: 성공 개수, failed: 실패 개수 }
   */
  async autoMatchAll(): Promise<{ matched: number; failed: number }> {
    const unmatchedListings = await this.findUnmatchedListings();

    let matched = 0;
    let failed = 0;

    for (const listing of unmatchedListings) {
      const result = await this.autoMatch(listing.id);
      if (result) {
        matched++;
      } else {
        failed++;
      }
    }

    return { matched, failed };
  }

  /**
   * 특정 Listing에 대한 매칭 후보 추천 (자동 매칭되지 않은 경우)
   * @param listingId Listing ID
   * @param limit 추천 개수 (기본 5개)
   * @returns 유사도 순으로 정렬된 Product Model 목록
   */
  async suggestMatches(listingId: string, limit: number = 5): Promise<Array<{ model: ProductModel; confidence: number }>> {
    const listing = await this.productListingRepository.findOne({
      where: { id: listingId },
      relations: ['brand'],
    });

    if (!listing || !listing.extractedModelName) {
      return [];
    }

    // 같은 브랜드의 모든 Product Model 조회
    const models = await this.productModelRepository.find({
      where: { brandId: listing.brandId },
    });

    if (models.length === 0) {
      return [];
    }

    // 유사도 계산 및 정렬
    const suggestions = models
      .map((model) => {
        const similarity = calculateSimilarity(listing.extractedModelName, model.modelName);
        const containsBonus = containsString(listing.extractedModelName, model.modelName) ? 0.1 : 0;
        const confidence = Math.min(similarity + containsBonus, 1.0);

        return { model, confidence };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    return suggestions;
  }
}
