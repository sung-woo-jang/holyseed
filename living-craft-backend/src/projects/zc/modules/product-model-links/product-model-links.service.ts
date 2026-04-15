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

  async delete(id: string): Promise<void> {
    await this.productModelLinkRepository.delete(id);
  }
}
