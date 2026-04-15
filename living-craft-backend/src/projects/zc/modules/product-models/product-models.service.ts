import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductModel } from './entities/product-model.entity';

@Injectable()
export class ProductModelsService {
  constructor(
    @InjectRepository(ProductModel)
    private readonly productModelRepository: Repository<ProductModel>,
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
}
