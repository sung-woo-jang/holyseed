import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { ServiceItem } from './entities/service-item.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
    @InjectRepository(ServiceItem) private readonly itemRepo: Repository<ServiceItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async getFullCatalog() {
    const categories = await this.catRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      relations: ['items', 'items.productGroups', 'items.productGroups.products', 'items.productGroups.products.features', 'items.productGroups.products.colors'],
    });
    return categories;
  }

  async getCategories() {
    return this.catRepo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async getServiceItems(categoryCode?: string) {
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'cat')
      .where('item.isActive = true');
    if (categoryCode && categoryCode !== 'all') {
      qb.andWhere('cat.code = :code', { code: categoryCode });
    }
    return qb.orderBy('cat.sortOrder', 'ASC').addOrderBy('item.sortOrder', 'ASC').getMany();
  }

  async getServiceItemByCode(code: string) {
    const item = await this.itemRepo.findOne({
      where: { code, isActive: true },
      relations: ['category', 'productGroups', 'productGroups.products', 'productGroups.products.features', 'productGroups.products.colors'],
    });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);
    return item;
  }

  async getProductByCode(code: string) {
    const product = await this.productRepo.findOne({
      where: { code, isActive: true },
      relations: ['productGroup', 'productGroup.serviceItem', 'productGroup.serviceItem.category', 'features', 'colors'],
    });
    if (!product) throw new NotFoundException(`제품 '${code}'를 찾을 수 없어요.`);
    return product;
  }

  async getFeaturedItems() {
    return this.itemRepo.find({
      where: { isFeatured: true, isActive: true },
      relations: ['category'],
      order: { sortOrder: 'ASC' },
    });
  }
}
