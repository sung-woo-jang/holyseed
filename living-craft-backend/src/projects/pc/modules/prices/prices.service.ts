import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductPrice } from './entities/product-price.entity';
import { UpsertPriceDto } from './dto/request/upsert-price.dto';

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(ProductPrice)
    private readonly repo: Repository<ProductPrice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

    let saved: ProductPrice;
    if (existing) {
      Object.assign(existing, {
        price: dto.price,
        currency: dto.currency || existing.currency,
        note: dto.note ?? existing.note,
        quotedAt: dto.quotedAt ? new Date(dto.quotedAt) : existing.quotedAt,
      });
      saved = await this.repo.save(existing);
    } else {
      const price = this.repo.create({
        productId: dto.productId,
        vendorId: dto.vendorId,
        price: dto.price,
        currency: dto.currency || 'KRW',
        note: dto.note,
        quotedAt: dto.quotedAt ? new Date(dto.quotedAt) : null,
      });
      try {
        saved = await this.repo.save(price);
      } catch (err) {
        if (err?.code === '23505' && err?.constraint?.startsWith('PK_')) {
          await this.dataSource.query(
            `SELECT setval('jip.pc_product_prices_id_seq', (SELECT MAX(id) FROM jip.pc_product_prices))`,
          );
          saved = await this.repo.save(price);
        } else {
          throw err;
        }
      }
    }

    await this.recomputeRepresentativePrice(dto.productId);
    return saved;
  }

  async delete(id: number): Promise<void> {
    const price = await this.repo.findOne({ where: { id } });
    if (!price) throw new NotFoundException('가격 정보를 찾을 수 없습니다.');
    await this.repo.delete(id);
    await this.recomputeRepresentativePrice(price.productId);
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.repo.delete({ productId });
    await this.dataSource.query(
      `UPDATE jip.pc_products SET representative_price = NULL WHERE id = $1`,
      [productId],
    );
  }

  async recomputeRepresentativePrice(productId: number): Promise<void> {
    const result = await this.dataSource.query(
      `SELECT MIN(pp.price)::int AS min_price
       FROM jip.pc_product_prices pp
       JOIN jip.pc_vendors v ON v.id = pp.vendor_id
       WHERE pp.product_id = $1 AND v.is_active = true`,
      [productId],
    );
    const minPrice = result[0]?.min_price ?? null;
    await this.dataSource.query(
      `UPDATE jip.pc_products SET representative_price = $1 WHERE id = $2`,
      [minPrice, productId],
    );
  }
}
