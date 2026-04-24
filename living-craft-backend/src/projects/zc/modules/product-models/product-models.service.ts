import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ProductModel } from './entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { UpdatePriceDto } from './dto/request/update-price.dto';
import { CreateModelDto } from './dto/request/create-model.dto';
import { LinkProductDto } from './dto/request/link-product.dto';
import { SearchModelsDto } from './dto/request/search-models.dto';

@Injectable()
export class ProductModelsService {
  constructor(
    @InjectRepository(ProductModel)
    private readonly productModelRepository: Repository<ProductModel>,
    @InjectRepository(ProductModelLink)
    private readonly linkRepository: Repository<ProductModelLink>,
    @InjectRepository(ProductListing)
    private readonly listingRepository: Repository<ProductListing>,
  ) {}

  async findAll(): Promise<ProductModel[]> {
    return await this.productModelRepository.find({
      relations: ['brand'],
    });
  }

  async findById(id: string): Promise<ProductModel | null> {
    return await this.productModelRepository.findOne({
      where: { id },
      relations: ['brand'],
    });
  }

  async findByModelName(modelName: string): Promise<ProductModel | null> {
    return await this.productModelRepository.findOne({
      where: { modelName },
      relations: ['brand'],
    });
  }

  async findByBrandId(brandId: string): Promise<ProductModel[]> {
    return await this.productModelRepository.find({
      where: { brandId },
      relations: ['brand'],
    });
  }

  async updatePrice(id: string, dto: UpdatePriceDto): Promise<ProductModel> {
    const model = await this.productModelRepository.findOne({
      where: { id },
    });

    if (!model) {
      throw new NotFoundException('제품 모델을 찾을 수 없습니다.');
    }

    // 원가 설정
    if (dto.costPrice !== undefined) {
      model.costPrice = dto.costPrice;
    }

    // 판매가 설정
    if (dto.sellingPrice !== undefined) {
      model.sellingPrice = dto.sellingPrice;
    }

    // 마진율 설정 (수동) 또는 자동 계산
    if (dto.marginRate !== undefined) {
      model.marginRate = dto.marginRate;
    } else if (model.costPrice && model.sellingPrice) {
      // 판매가나 원가가 변경되면 마진율 자동 계산
      model.marginRate = this.calculateMarginRate(model.costPrice, model.sellingPrice);
    }

    // 가격 메모
    if (dto.priceNote !== undefined) {
      model.priceNote = dto.priceNote;
    }

    model.priceUpdatedAt = new Date();

    return await this.productModelRepository.save(model);
  }

  /**
   * 연결된 제품의 최저가를 원가로 자동 계산
   */
  async calculateAndUpdateCostPrice(modelId: string): Promise<ProductModel> {
    const model = await this.productModelRepository.findOne({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException('제품 모델을 찾을 수 없습니다.');
    }

    // 연결된 제품들의 가격 조회
    const links = await this.linkRepository.find({
      where: { modelId },
      relations: ['listing'],
    });

    if (links.length === 0) {
      throw new BadRequestException('연결된 제품이 없어 원가를 계산할 수 없습니다.');
    }

    // 최저가 계산 (할인가가 있으면 할인가, 없으면 정상가)
    const prices = links
      .map((link) => link.listing.currentDiscountPrice ?? link.listing.currentPrice)
      .filter((price) => price > 0);

    if (prices.length === 0) {
      throw new BadRequestException('유효한 가격 정보가 없어 원가를 계산할 수 없습니다.');
    }

    const lowestPrice = Math.min(...prices);
    model.costPrice = lowestPrice;

    // 판매가가 이미 설정되어 있으면 마진율 재계산
    if (model.sellingPrice) {
      model.marginRate = this.calculateMarginRate(model.costPrice, model.sellingPrice);
    }

    model.priceUpdatedAt = new Date();

    return await this.productModelRepository.save(model);
  }

  /**
   * 마진율 계산 헬퍼 함수
   */
  private calculateMarginRate(costPrice: number, sellingPrice: number): number {
    if (costPrice === 0) {
      return 0;
    }
    return Math.round(((sellingPrice - costPrice) / costPrice) * 100 * 100) / 100; // 소수점 2자리
  }

  /**
   * 제품 모델 생성
   */
  async createModel(dto: CreateModelDto): Promise<ProductModel> {
    // 모델명 중복 확인
    const existing = await this.productModelRepository.findOne({
      where: { modelName: dto.modelName },
    });

    if (existing) {
      throw new BadRequestException('이미 존재하는 모델명입니다.');
    }

    const model = this.productModelRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });

    return await this.productModelRepository.save(model);
  }

  /**
   * 제품 모델 검색
   */
  async searchModels(dto: SearchModelsDto): Promise<{ data: ProductModel[]; total: number }> {
    const { page = 1, limit = 20, search, brandId, isActive, minSellingPrice, maxSellingPrice } = dto;

    const query = this.productModelRepository.createQueryBuilder('model').leftJoinAndSelect('model.brand', 'brand');

    // 검색어
    if (search) {
      query.andWhere('(model.modelName LIKE :search OR model.displayName LIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 브랜드 필터
    if (brandId) {
      query.andWhere('model.brandId = :brandId', { brandId });
    }

    // 활성화 여부
    if (isActive !== undefined) {
      query.andWhere('model.isActive = :isActive', { isActive });
    }

    // 가격 범위
    if (minSellingPrice !== undefined) {
      query.andWhere('model.sellingPrice >= :minPrice', { minPrice: minSellingPrice });
    }
    if (maxSellingPrice !== undefined) {
      query.andWhere('model.sellingPrice <= :maxPrice', { maxPrice: maxSellingPrice });
    }

    // 페이지네이션
    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();

    return { data, total };
  }

  /**
   * 제품과 모델 연결
   */
  async linkProduct(modelId: string, dto: LinkProductDto): Promise<ProductModelLink> {
    // 모델 존재 확인
    const model = await this.productModelRepository.findOne({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException('제품 모델을 찾을 수 없습니다.');
    }

    // 제품 존재 확인
    const listing = await this.listingRepository.findOne({
      where: { id: dto.productListingId },
    });

    if (!listing) {
      throw new NotFoundException('제품을 찾을 수 없습니다.');
    }

    // 이미 연결되어 있는지 확인
    const existingLink = await this.linkRepository.findOne({
      where: { listingId: dto.productListingId },
    });

    if (existingLink) {
      throw new BadRequestException('이미 다른 모델에 연결된 제품입니다.');
    }

    // 연결 생성
    const link = this.linkRepository.create({
      listingId: dto.productListingId,
      modelId,
      matchType: 'manual_matched',
      linkedAt: new Date(),
    });

    return await this.linkRepository.save(link);
  }

  /**
   * 제품 연결 해제
   */
  async unlinkProduct(modelId: string, listingId: string): Promise<void> {
    const link = await this.linkRepository.findOne({
      where: {
        modelId,
        listingId,
      },
    });

    if (!link) {
      throw new NotFoundException('연결을 찾을 수 없습니다.');
    }

    await this.linkRepository.remove(link);
  }

  /**
   * 모델에 연결된 제품 목록 조회
   */
  async getLinkedProducts(modelId: string): Promise<ProductListing[]> {
    const links = await this.linkRepository.find({
      where: { modelId },
      relations: ['listing', 'listing.site', 'listing.brand'],
    });

    return links.map((link) => link.listing);
  }
}
