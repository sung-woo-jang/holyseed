import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductModelLink } from './entities/product-model-link.entity';

@Injectable()
export class ProductModelLinksService {
  constructor(
    @InjectRepository(ProductModelLink)
    private readonly productModelLinkRepository: Repository<ProductModelLink>,
  ) {}

  async findAll(): Promise<ProductModelLink[]> {
    return await this.productModelLinkRepository.find({
      relations: ['listing', 'model'],
    });
  }

  async findByListingId(listingId: string): Promise<ProductModelLink | null> {
    return await this.productModelLinkRepository.findOne({
      where: { listingId },
      relations: ['listing', 'model'],
    });
  }

  async findByModelId(modelId: string): Promise<ProductModelLink[]> {
    return await this.productModelLinkRepository.find({
      where: { modelId },
      relations: ['listing', 'model'],
    });
  }

  async create(
    listingId: string,
    modelId: string,
    linkedBy?: string,
  ): Promise<ProductModelLink> {
    const link = this.productModelLinkRepository.create({
      listingId,
      modelId,
      linkedAt: new Date(),
      linkedBy,
    });

    return await this.productModelLinkRepository.save(link);
  }

  async search(dto: {
    page?: number;
    limit?: number;
    search?: string;
    matchType?: string;
  }): Promise<{ data: ProductModelLink[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 30;

    const qb = this.productModelLinkRepository
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.listing', 'listing')
      .leftJoinAndSelect('listing.site', 'site')
      .leftJoinAndSelect('listing.brand', 'listingBrand')
      .leftJoinAndSelect('link.model', 'model')
      .leftJoinAndSelect('model.brand', 'modelBrand')
      .orderBy('link.linkedAt', 'DESC');

    if (dto.search) {
      qb.andWhere(
        '(listing.productName ILIKE :search OR model.modelName ILIKE :search OR model.displayName ILIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    if (dto.matchType) {
      qb.andWhere('link.matchType = :matchType', { matchType: dto.matchType });
    }

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string): Promise<void> {
    await this.productModelLinkRepository.delete(id);
  }
}
