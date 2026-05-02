import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import { ProductListing } from './entities/product-listing.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { ProductQueryDto, ProductListResponseDto } from './dto';
import { CreateManualListingDto } from './dto/request/create-manual-listing.dto';
import { UpdateManualListingDto } from './dto/request/update-manual-listing.dto';

@Injectable()
export class ProductListingsService {
  constructor(
    @InjectRepository(ProductListing)
    private readonly productListingRepository: Repository<ProductListing>,
    @InjectRepository(ProductModelLink)
    private readonly linkRepository: Repository<ProductModelLink>,
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
      site: listing.site
        ? { id: listing.site.id, code: listing.site.code, name: listing.site.name }
        : undefined,
      isManual: listing.isManual,
      manualPriceNote: listing.manualPriceNote,
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

  // === 수동 Listing CRUD ===

  async createManualListing(dto: CreateManualListingDto): Promise<ProductListing> {
    const siteProductId = `manual-${randomUUID()}`;
    const listing = this.productListingRepository.create({
      ...dto,
      siteProductId,
      isManual: true,
      isAvailable: true,
    });
    return await this.productListingRepository.save(listing);
  }

  async updateManualListing(id: string, dto: UpdateManualListingDto): Promise<ProductListing> {
    const listing = await this.productListingRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('제품을 찾을 수 없습니다.');
    if (!listing.isManual) throw new BadRequestException('수동 입력 제품만 수정할 수 있습니다.');

    Object.assign(listing, dto);
    return await this.productListingRepository.save(listing);
  }

  async deleteManualListing(id: string): Promise<void> {
    const listing = await this.productListingRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('제품을 찾을 수 없습니다.');
    if (!listing.isManual) throw new BadRequestException('수동 입력 제품만 삭제할 수 있습니다.');
    await this.productListingRepository.remove(listing);
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

  /**
   * 미매칭 제품 목록 조회 (ProductModel에 연결되지 않은 제품)
   */
  async findUnmatched(query: ProductQueryDto): Promise<ProductListResponseDto> {
    const { page = 1, limit = 20, search, brandId, siteCode } = query;

    // 연결된 제품 ID 목록 가져오기
    const linkedProductIds = await this.linkRepository
      .createQueryBuilder('link')
      .select('link.listingId')
      .getRawMany()
      .then((results) => results.map((r) => r.link_listingId));

    // 미매칭 제품 조회
    const queryBuilder = this.productListingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.site', 'site')
      .leftJoinAndSelect('listing.siteCategory', 'category')
      .leftJoinAndSelect('listing.brand', 'brand')
      .where('listing.isAvailable = :isAvailable', { isAvailable: true })
      .orderBy('listing.createdAt', 'DESC');

    // 연결된 제품 제외
    if (linkedProductIds.length > 0) {
      queryBuilder.andWhere('listing.id NOT IN (:...linkedIds)', { linkedIds: linkedProductIds });
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere('(listing.productName ILIKE :search OR listing.extractedModelName ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 브랜드 필터
    if (brandId) {
      queryBuilder.andWhere('listing.brandId = :brandId', { brandId });
    }

    // 사이트 코드 필터
    if (siteCode) {
      queryBuilder.andWhere('site.code = :siteCode', { siteCode });
    }

    // 총 개수
    const total = await queryBuilder.getCount();

    // 페이지네이션
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: products.map((p) => this.mapToResponseDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 제품 검색 (사이트 코드 + 매칭 상태 필터 지원)
   */
  async searchWithFilters(query: ProductQueryDto): Promise<ProductListResponseDto> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      brandId,
      siteCode,
      hasModel,
      search,
      minPrice,
      maxPrice,
      onSale,
    } = query;

    const queryBuilder = this.productListingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.site', 'site')
      .leftJoinAndSelect('listing.siteCategory', 'category')
      .leftJoinAndSelect('listing.brand', 'brand')
      .leftJoinAndSelect('listing.productImages', 'images')
      .leftJoin(ProductModelLink, 'link', 'link.listingId = listing.id')
      .where('listing.isAvailable = :isAvailable', { isAvailable: true })
      .orderBy('listing.createdAt', 'DESC');

    // 사이트 필터
    if (siteCode) {
      queryBuilder.andWhere('site.code = :siteCode', { siteCode });
    }

    // 카테고리 필터
    if (categoryId) {
      queryBuilder.andWhere('listing.siteCategoryId = :categoryId', { categoryId });
    }

    // 브랜드 필터
    if (brandId) {
      queryBuilder.andWhere('listing.brandId = :brandId', { brandId });
    }

    // 매칭 상태 필터
    if (hasModel === true) {
      // 매칭됨: ProductModelLink가 존재
      queryBuilder.andWhere('link.id IS NOT NULL');
    } else if (hasModel === false) {
      // 미매칭: ProductModelLink가 없음
      queryBuilder.andWhere('link.id IS NULL');
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere('(listing.productName ILIKE :search OR listing.extractedModelName ILIKE :search)', {
        search: `%${search}%`,
      });
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
}
