import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductPrice } from './entities/product-price.entity';
import { UpsertPriceDto } from './dto/request/upsert-price.dto';

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(ProductPrice)
    private readonly repo: Repository<ProductPrice>,
  ) {}

  async findByProductId(productId: number): Promise<ProductPrice[]> {
    return this.repo.find({ where: { productId }, order: { price: 'ASC' } });
  }

  async findByProductIds(productIds: number[]): Promise<ProductPrice[]> {
    if (productIds.length === 0) return [];
    return this.repo.find({ where: { productId: In(productIds) }, order: { price: 'ASC' } });
  }

  async upsert(dto: UpsertPriceDto): Promise<ProductPrice> {
    const existing = await this.repo.findOne({
      where: { productId: dto.productId, vendorId: dto.vendorId },
    });

    if (existing) {
      Object.assign(existing, {
        price: dto.price,
        currency: dto.currency || existing.currency,
        note: dto.note ?? existing.note,
        quotedAt: dto.quotedAt ? new Date(dto.quotedAt) : existing.quotedAt,
      });
      return this.repo.save(existing);
    }

    const price = this.repo.create({
      productId: dto.productId,
      vendorId: dto.vendorId,
      price: dto.price,
      currency: dto.currency || 'KRW',
      note: dto.note,
      quotedAt: dto.quotedAt ? new Date(dto.quotedAt) : null,
    });
    return this.repo.save(price);
  }

  async delete(id: number): Promise<void> {
    const price = await this.repo.findOne({ where: { id } });
    if (!price) throw new NotFoundException('가격 정보를 찾을 수 없습니다.');
    await this.repo.delete(id);
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.repo.delete({ productId });
  }
}
