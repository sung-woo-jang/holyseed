import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.find();
  }

  async findAllWithProductCount(): Promise<any[]> {
    const brands = await this.brandRepository
      .createQueryBuilder('brand')
      .leftJoin('brand.productListings', 'listing')
      .select('brand.id', 'brand_id')
      .addSelect('brand.name', 'brand_name')
      .addSelect('brand.createdAt', 'brand_createdAt')
      .addSelect('brand.updatedAt', 'brand_updatedAt')
      .addSelect('COUNT(listing.id)', 'productCount')
      .groupBy('brand.id')
      .addGroupBy('brand.name')
      .addGroupBy('brand.createdAt')
      .addGroupBy('brand.updatedAt')
      .orderBy('brand.name', 'ASC')
      .getRawMany();

    return brands.map((brand) => ({
      id: brand.brand_id,
      name: brand.brand_name,
      productCount: parseInt(brand.productCount || '0', 10),
      createdAt: brand.brand_createdAt,
      updatedAt: brand.brand_updatedAt,
    }));
  }

  async findByName(name: string): Promise<Brand | null> {
    return await this.brandRepository.findOne({ where: { name } });
  }

  async findById(id: string): Promise<Brand | null> {
    return await this.brandRepository.findOne({ where: { id } });
  }

  async findOrCreate(name: string): Promise<Brand> {
    let brand = await this.findByName(name);

    if (!brand) {
      brand = this.brandRepository.create({ name });
      brand = await this.brandRepository.save(brand);
    }

    return brand;
  }
}
