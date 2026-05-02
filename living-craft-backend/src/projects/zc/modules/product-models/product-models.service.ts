import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProductModel } from './entities/product-model.entity';
import { ProductModelLink } from '../product-model-links/entities/product-model-link.entity';
import { ProductListing } from '../product-listings/entities/product-listing.entity';
import { PriceHistory } from '../price-history/entities/price-history.entity';
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
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  async findAll(): Promise<ProductModel[]> {
    return await this.productModelRepository.find({ relations: ['brand'] });
  }

  async findById(id: string): Promise<ProductModel | null> {
    const model = await this.productModelRepository.findOne({
      where: { id },
      relations: ['brand', 'unifiedCategory'],
    });
    if (!model) return null;
    return this.attachDerived(model);
  }

  async findByModelName(modelName: string): Promise<ProductModel | null> {
    return await this.productModelRepository.findOne({
      where: { modelName },
      relations: ['brand'],
    });
  }

  async findByBrandId(brandId: string): Promise<ProductModel[]> {
    const models = await this.productModelRepository.find({
      where: { brandId },
      relations: ['brand'],
    });
    return models.map((m) => this.attachDerived(m));
  }

  async updatePrice(id: string, dto: UpdatePriceDto): Promise<ProductModel> {
    const model = await this.productModelRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException('제품 모델을 찾을 수 없습니다.');

    if (dto.materialCost !== undefined) {
      model.materialCost = dto.materialCost;
    }
    if (dto.laborCost !== undefined) {
      model.laborCost = dto.laborCost;
    }
    if (dto.marginRate !== undefined) {
      model.marginRate = dto.marginRate;
    }
    if (dto.priceNote !== undefined) {
      model.priceNote = dto.priceNote;
    }

    model.priceUpdatedAt = new Date();
    const saved = await this.productModelRepository.save(model);
    return this.attachDerived(saved);
  }

  async calculateAndUpdateMaterialCost(modelId: string): Promise<ProductModel> {
    const model = await this.productModelRepository.findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException('제품 모델을 찾을 수 없습니다.');

    const links = await this.linkRepository.find({
      where: { modelId },
      relations: ['listing'],
    });

    if (links.length === 0) {
      throw new BadRequestException('연결된 제품이 없어 자재가를 계산할 수 없습니다.');
    }

    const prices = links
      .map((link) => link.listing.currentDiscountPrice ?? link.listing.currentPrice)
      .filter((price) => price > 0);

    if (prices.length === 0) {
      throw new BadRequestException('유효한 가격 정보가 없어 자재가를 계산할 수 없습니다.');
    }

    const lowestPrice = Math.min(...prices);
    model.materialCost = lowestPrice;
    model.priceUpdatedAt = new Date();

    const saved = await this.productModelRepository.save(model);
    return this.attachDerived(saved);
  }

  async getModelCompare(modelId: string): Promise<object> {
    const model = await this.productModelRepository.findOne({
      where: { id: modelId },
      relations: ['brand', 'unifiedCategory'],
    });
    if (!model) throw new NotFoundException('제품 모델을 찾을 수 없습니다.');

    const links = await this.linkRepository.find({
      where: { modelId },
      relations: ['listing', 'listing.site'],
    });

    const listings = links.map((link) => link.listing);

    const since = new Date();
    since.setDate(since.getDate() - 90);

    const priceHistoryByListing = await Promise.all(
      listings.map(async (listing) => {
        const points = await this.priceHistoryRepository.find({
          where: { listingId: listing.id, recordedAt: Between(since, new Date()) },
          order: { recordedAt: 'ASC' },
        });
        return {
          listingId: listing.id,
          siteName: listing.site?.name ?? '알 수 없음',
          points: points.map((p) => ({
            recordedAt: p.recordedAt,
            price: p.price,
            discountPrice: p.discountPrice,
          })),
        };
      }),
    );

    const currentPrices = listings
      .map((l) => l.currentDiscountPrice ?? l.currentPrice)
      .filter((p) => p > 0);
    const lowestPrice = currentPrices.length > 0 ? Math.min(...currentPrices) : null;
    const highestPrice = currentPrices.length > 0 ? Math.max(...currentPrices) : null;

    const derivedModel = this.attachDerived(model);

    return {
      model: derivedModel,
      listings: listings.map((l) => ({
        id: l.id,
        siteName: l.site?.name ?? '알 수 없음',
        siteCode: l.site?.code ?? '',
        isManual: l.isManual,
        currentPrice: l.currentPrice,
        currentDiscountPrice: l.currentDiscountPrice,
        productUrl: l.productUrl,
        lastCrawledAtOrCreated: l.lastCrawledAt ?? l.createdAt,
        isLowest: (l.currentDiscountPrice ?? l.currentPrice) === lowestPrice,
        manualPriceNote: l.manualPriceNote,
      })),
      priceHistory: priceHistoryByListing,
      lowestPrice,
      highestPrice,
    };
  }

  async createModel(dto: CreateModelDto): Promise<ProductModel> {
    const existing = await this.productModelRepository.findOne({
      where: { modelName: dto.modelName },
    });
    if (existing) throw new BadRequestException('이미 존재하는 모델명입니다.');

    const model = this.productModelRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.productModelRepository.save(model);
    return this.attachDerived(saved);
  }

  async searchModels(dto: SearchModelsDto): Promise<{ data: object[]; total: number }> {
    const { page = 1, limit = 20, search, brandId, isActive, minSellingPrice, maxSellingPrice } = dto;

    const query = this.productModelRepository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.brand', 'brand');

    if (search) {
      query.andWhere('(model.modelName LIKE :search OR model.displayName LIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (brandId) query.andWhere('model.brandId = :brandId', { brandId });
    if (isActive !== undefined) query.andWhere('model.isActive = :isActive', { isActive });
    if (minSellingPrice !== undefined) query.andWhere('model.materialCost >= :minPrice', { minPrice: minSellingPrice });
    if (maxSellingPrice !== undefined) query.andWhere('model.materialCost <= :maxPrice', { maxPrice: maxSellingPrice });

    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit);

    const data = await query.getMany();
    return { data: data.map((m) => this.attachDerived(m)), total };
  }

  async linkProduct(modelId: string, dto: LinkProductDto): Promise<ProductModelLink> {
    const model = await this.productModelRepository.findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException('제품 모델을 찾을 수 없습니다.');

    const listing = await this.listingRepository.findOne({ where: { id: dto.productListingId } });
    if (!listing) throw new NotFoundException('제품을 찾을 수 없습니다.');

    const existingLink = await this.linkRepository.findOne({
      where: { listingId: dto.productListingId },
    });
    if (existingLink) throw new BadRequestException('이미 다른 모델에 연결된 제품입니다.');

    const link = this.linkRepository.create({
      listingId: dto.productListingId,
      modelId,
      matchType: 'manual_matched',
      linkedAt: new Date(),
    });
    return await this.linkRepository.save(link);
  }

  async unlinkProduct(modelId: string, listingId: string): Promise<void> {
    const link = await this.linkRepository.findOne({ where: { modelId, listingId } });
    if (!link) throw new NotFoundException('연결을 찾을 수 없습니다.');
    await this.linkRepository.remove(link);
  }

  async getLinkedProducts(modelId: string): Promise<ProductListing[]> {
    const links = await this.linkRepository.find({
      where: { modelId },
      relations: ['listing', 'listing.site', 'listing.brand'],
    });
    return links.map((link) => link.listing);
  }

  private attachDerived(model: ProductModel): any {
    const materialCost = model.materialCost ?? 0;
    const marginRate = model.marginRate ?? 0;
    const laborCost = model.laborCost ?? 0;
    const materialPrice = Math.round(materialCost * (1 + marginRate / 100));
    const derivedUnitPrice = materialPrice + laborCost;
    return Object.assign(model, { materialPrice, derivedUnitPrice });
  }

}
