import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductListing } from './entities/product-listing.entity';
import { ProductQueryDto, ProductListResponseDto } from './dto';

@Injectable()
export class ProductListingsService {
  constructor(
    @InjectRepository(ProductListing)
    private readonly productListingRepository: Repository<ProductListing>,
  ) {}

  /**
   * 제품 목록 조회 (페이지네이션, 필터링)
   */
  async findAllWithPagination(
    siteId: string,
    query: ProductQueryDto,
  ): Promise<ProductListResponseDto> {
    const { page = 1, limit = 20, categoryId, brandId, search, minPrice, maxPrice, onSale } = query;

    const queryBuilder = this.productListingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.siteCategory', 'category')
      .leftJoinAndSelect('listing.brand', 'brand')
      .leftJoinAndSelect('listing.productImages', 'images')
      .where('listing.siteId = :siteId', { siteId })
      .andWhere('listing.isAvailable = :isAvailable', { isAvailable: true })
      .orderBy('listing.createdAt', 'DESC');

    // 카테고리 필터
    if (categoryId) {
      queryBuilder.andWhere('listing.siteCategoryId = :categoryId', { categoryId });
    }

    // 브랜드 필터
    if (brandId) {
      queryBuilder.andWhere('listing.brandId = :brandId', { brandId });
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere('listing.productName ILIKE :search', { search: `%${search}%` });
    }

    // 가격 필터
    if (minPrice !== undefined) {
      queryBuilder.andWhere('listing.currentPrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('listing.currentPrice <= :maxPrice', { maxPrice });
    }

    // 할인 상품만
    if (onSale === true) {
      queryBuilder.andWhere('listing.currentDiscountPrice IS NOT NULL');
    }

    // 페이지네이션
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 제품 상세 조회
   */
  async findOne(id: string): Promise<ProductListing> {
    const product = await this.productListingRepository.findOne({
      where: { id },
      relations: ['siteCategory', 'brand', 'productImages'],
    });

    if (!product) {
      throw new NotFoundException('제품을 찾을 수 없습니다.');
    }

    return product;
  }

  /**
   * 카테고리별 제품 목록
   */
  async findByCategory(categoryId: string, query: ProductQueryDto): Promise<ProductListResponseDto> {
    const category = await this.productListingRepository
      .createQueryBuilder('listing')
      .leftJoin('listing.siteCategory', 'category')
      .where('category.id = :categoryId', { categoryId })
      .select('listing.siteId')
      .getOne();

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return await this.findAllWithPagination(category.siteId, {
      ...query,
      categoryId,
    });
  }

  /**
   * Entity를 Response DTO로 변환
   */
  private mapToResponseDto(listing: ProductListing): any {
    return {
      id: listing.id,
      siteProductId: listing.siteProductId,
      productName: listing.productName,
      extractedModelName: listing.extractedModelName,
      currentPrice: listing.currentPrice,
      currentDiscountPrice: listing.currentDiscountPrice,
      description: listing.description,
      manufacturer: listing.manufacturer,
      origin: listing.origin,
      productUrl: listing.productUrl,
      isAvailable: listing.isAvailable,
      category: listing.siteCategory
        ? {
            id: listing.siteCategory.id,
            name: listing.siteCategory.name,
            siteCategoryCode: listing.siteCategory.siteCategoryCode,
          }
        : undefined,
      brand: listing.brand
        ? {
            id: listing.brand.id,
            name: listing.brand.name,
          }
        : undefined,
      images: listing.productImages
        ? listing.productImages.map((img) => ({
            id: img.id,
            originalUrl: img.originalUrl,
            type: img.type,
            sortOrder: img.sortOrder,
          }))
        : [],
      lastCrawledAt: listing.lastCrawledAt,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  /**
   * 사이트 코드로 사이트 ID 조회
   */
  async getSiteIdByCode(siteCode: string): Promise<string> {
    const result = await this.productListingRepository
      .createQueryBuilder('listing')
      .innerJoin('listing.site', 'site')
      .where('site.code = :code', { code: siteCode })
      .select('site.id')
      .getRawOne();

    if (!result) {
      throw new NotFoundException(`사이트를 찾을 수 없습니다: ${siteCode}`);
    }

    return result.site_id;
  }

  // === 레거시 메서드 (하위 호환성) ===

  async findAll(): Promise<ProductListing[]> {
    return await this.productListingRepository.find({
      relations: ['site', 'siteCategory', 'brand'],
    });
  }

  async findById(id: string): Promise<ProductListing | null> {
    return await this.productListingRepository.findOne({
      where: { id },
      relations: ['site', 'siteCategory', 'brand'],
    });
  }

  async findBySiteAndProductId(
    siteId: string,
    siteProductId: string,
  ): Promise<ProductListing | null> {
    return await this.productListingRepository.findOne({
      where: { siteId, siteProductId },
      relations: ['site', 'siteCategory', 'brand'],
    });
  }

  async findBySiteId(siteId: string): Promise<ProductListing[]> {
    return await this.productListingRepository.find({
      where: { siteId },
      relations: ['site', 'siteCategory', 'brand'],
    });
  }
}
