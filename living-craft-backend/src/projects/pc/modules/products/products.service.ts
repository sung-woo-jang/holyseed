import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductFeature } from './entities/product-feature.entity';
import { ProductColor } from './entities/product-color.entity';
import { ProductPrice } from '../prices/entities/product-price.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { PcCategory } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/request/create-product.dto';
import { UpdateProductDto } from './dto/request/update-product.dto';
import { SearchProductsDto } from './dto/request/search-products.dto';
import { CompareProductsDto } from './dto/request/compare-products.dto';
import { ImportProductsDto } from './dto/request/import-products.dto';
import { LinkServiceItemDto } from './dto/request/link-service-item.dto';
import { CategoriesService } from '../categories/categories.service';
import { PricesService } from '../prices/prices.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductFeature)
    private readonly featureRepo: Repository<ProductFeature>,
    @InjectRepository(ProductColor)
    private readonly colorRepo: Repository<ProductColor>,
    @InjectRepository(ProductPrice)
    private readonly priceRepo: Repository<ProductPrice>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(PcCategory)
    private readonly categoryRepo: Repository<PcCategory>,
    private readonly categoriesService: CategoriesService,
    private readonly pricesService: PricesService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async search(dto: SearchProductsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const isActive = dto.isActive !== false;

    let categoryIds: number[] | undefined;
    if (dto.categoryId) {
      if (dto.includeDescendants !== false) {
        categoryIds = await this.categoriesService.collectDescendantIds(dto.categoryId);
      } else {
        categoryIds = [dto.categoryId];
      }
    }

    const qb = this.productRepo.createQueryBuilder('p');
    qb.where('p.is_active = :isActive', { isActive });

    if (categoryIds) {
      qb.andWhere('p.category_id IN (:...categoryIds)', { categoryIds });
    }

    if (dto.search) {
      const term = `%${dto.search}%`;
      qb.andWhere(
        '(p.model_code ILIKE :term OR p.display_name ILIKE :term OR p.brand ILIKE :term)',
        { term },
      );
    }

    if (dto.brand) {
      qb.andWhere('p.brand ILIKE :brand', { brand: `%${dto.brand}%` });
    }

    const total = await qb.getCount();
    const items = await qb
      .orderBy('p.display_name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');

    const [images, prices, features, colors] = await Promise.all([
      this.imageRepo.find({ where: { productId: id }, order: { sortOrder: 'ASC', isPrimary: 'DESC' } }),
      this.priceRepo.find({ where: { productId: id }, order: { price: 'ASC' } }),
      this.featureRepo.find({ where: { productId: id }, order: { sortOrder: 'ASC' } }),
      this.colorRepo.find({ where: { productId: id }, order: { sortOrder: 'ASC' } }),
    ]);

    const vendorIds = [...new Set(prices.map((p) => p.vendorId))];
    const vendors = vendorIds.length > 0 ? await this.vendorRepo.findBy({ id: In(vendorIds) }) : [];
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const category = await this.categoryRepo.findOne({ where: { id: product.categoryId } });

    return {
      ...product,
      category,
      images,
      features,
      colors,
      prices: prices.map((p) => ({ ...p, vendor: vendorMap.get(p.vendorId) })),
    };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const normalizedCode = dto.modelCode.trim();
    const existing = await this.productRepo.findOne({ where: { modelCode: normalizedCode } });
    if (existing) throw new BadRequestException(`이미 존재하는 모델코드입니다: ${normalizedCode}`);

    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');

    const product = this.productRepo.create({
      ...dto,
      modelCode: normalizedCode,
      unit: dto.unit || 'EA',
      isActive: dto.isActive ?? true,
    });
    return this.productRepo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');

    if (dto.modelCode) {
      const normalizedCode = dto.modelCode.trim();
      const dup = await this.productRepo.findOne({ where: { modelCode: normalizedCode } });
      if (dup && dup.id !== id) throw new BadRequestException('이미 존재하는 모델코드입니다.');
      dto.modelCode = normalizedCode;
    }

    if (dto.categoryId) {
      const cat = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async delete(id: number): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');

    const images = await this.imageRepo.find({ where: { productId: id } });

    await this.dataSource.transaction(async (em) => {
      await em.delete(ProductImage, { productId: id });
      await em.delete(ProductPrice, { productId: id });
      await em.delete(Product, { id });
    });

    return;
  }

  async compare(dto: CompareProductsDto) {
    const categoryIds =
      dto.includeDescendants !== false
        ? await this.categoriesService.collectDescendantIds(dto.categoryId)
        : [dto.categoryId];

    const products = await this.productRepo.find({
      where: { categoryId: In(categoryIds), isActive: true },
      order: { displayName: 'ASC' },
    });

    if (products.length === 0) return { products: [], vendors: [] };

    const productIds = products.map((p) => p.id);
    const allPrices = await this.pricesService.findByProductIds(productIds);

    const vendorIds = [...new Set(allPrices.map((p) => p.vendorId))];
    const vendors = vendorIds.length > 0 ? await this.vendorRepo.findBy({ id: In(vendorIds) }) : [];
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    const pricesByProduct = new Map<number, typeof allPrices>();
    allPrices.forEach((p) => {
      if (!pricesByProduct.has(p.productId)) pricesByProduct.set(p.productId, []);
      pricesByProduct.get(p.productId).push(p);
    });

    const categoryIds2 = [...new Set(products.map((p) => p.categoryId))];
    const categories = categoryIds2.length > 0 ? await this.categoryRepo.findBy({ id: In(categoryIds2) }) : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const result = products.map((product) => {
      const productPrices = pricesByProduct.get(product.id) || [];
      return {
        ...product,
        category: categoryMap.get(product.categoryId),
        prices: productPrices.map((p) => ({ ...p, vendor: vendorMap.get(p.vendorId) })),
      };
    });

    return { products: result, vendors };
  }

  async setFeatures(productId: number, features: { label: string; description?: string }[]): Promise<ProductFeature[]> {
    await this.featureRepo.delete({ productId });
    if (features.length === 0) return [];
    const entities = features.map((f, i) => this.featureRepo.create({ productId, label: f.label, description: f.description ?? null, sortOrder: i }));
    return this.featureRepo.save(entities);
  }

  async setColors(productId: number, labels: string[]): Promise<ProductColor[]> {
    await this.colorRepo.delete({ productId });
    if (labels.length === 0) return [];
    const entities = labels.map((label, i) => this.colorRepo.create({ productId, label, sortOrder: i }));
    return this.colorRepo.save(entities);
  }

  async linkServiceItem(productId: number, dto: LinkServiceItemDto): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');

    if (dto.code !== undefined && dto.code !== null) {
      const dup = await this.productRepo.findOne({ where: { code: dto.code } });
      if (dup && dup.id !== productId) throw new BadRequestException(`이미 사용 중인 코드입니다: ${dto.code}`);
    }

    Object.assign(product, {
      serviceItemId: dto.serviceItemId !== undefined ? dto.serviceItemId : product.serviceItemId,
      code: dto.code !== undefined ? dto.code : product.code,
      illustKind: dto.illustKind ?? product.illustKind,
      sortOrder: dto.sortOrder ?? product.sortOrder,
    });
    return this.productRepo.save(product);
  }

  async recomputePrice(productId: number): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('제품을 찾을 수 없습니다.');
    await this.pricesService.recomputeRepresentativePrice(productId);
  }

  async importBulk(dto: ImportProductsDto) {
    const options = dto.options || {};
    const autoCreateCategory = options.autoCreateCategory ?? false;
    const autoCreateVendor = options.autoCreateVendor ?? false;
    const atomic = options.atomic ?? false;

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; reason: string }> = [];

    const processItem = async (item: ImportProductsDto['items'][0], index: number) => {
      try {
        let categoryId: number | undefined;

        if (item.categoryPath && item.categoryPath.length > 0) {
          if (autoCreateCategory) {
            const category = await this.categoriesService.findOrCreateByPath(item.categoryPath);
            categoryId = category.id;
          } else {
            let parentId: number | null = null;
            let found = true;
            for (const name of item.categoryPath) {
              const cat = await this.categoryRepo.findOne({
                where: { parentId: parentId as any, name: name.trim() },
              });
              if (!cat) {
                found = false;
                errors.push({ index, reason: `카테고리를 찾을 수 없습니다: "${name}" (경로: ${item.categoryPath.join(' > ')})` });
                break;
              }
              parentId = cat.id;
              categoryId = cat.id;
            }
            if (!found) return;
          }
        }

        const modelCode = item.modelCode.trim();
        const existing = await this.productRepo.findOne({ where: { modelCode } });

        if (existing) {
          await this.productRepo.update(existing.id, {
            displayName: item.displayName?.trim() || existing.displayName,
            brand: item.brand?.trim() || existing.brand,
            spec: item.spec || existing.spec,
            unit: item.unit || existing.unit,
            note: item.note || existing.note,
            description: item.description || existing.description,
            ...(categoryId ? { categoryId } : {}),
          });
          updated++;

          if (item.prices && item.prices.length > 0) {
            for (const priceItem of item.prices) {
              let vendor: Vendor | null = null;
              if (autoCreateVendor) {
                vendor = await this.vendorRepo.findOne({ where: { name: priceItem.vendor.trim() } });
                if (!vendor) {
                  vendor = await this.vendorRepo.save(this.vendorRepo.create({ name: priceItem.vendor.trim(), isActive: true, sortOrder: 0 }));
                }
              } else {
                vendor = await this.vendorRepo.findOne({ where: { name: priceItem.vendor.trim() } });
                if (!vendor) {
                  errors.push({ index, reason: `업체를 찾을 수 없습니다: "${priceItem.vendor}"` });
                  continue;
                }
              }
              await this.pricesService.upsert({ productId: existing.id, vendorId: vendor.id, price: priceItem.price, note: priceItem.note });
            }
          }
        } else {
          if (!categoryId) {
            if (!item.categoryPath || item.categoryPath.length === 0) {
              errors.push({ index, reason: '신규 제품에는 categoryPath가 필요합니다.' });
              return;
            }
            errors.push({ index, reason: `카테고리를 찾을 수 없어 제품을 생성할 수 없습니다: ${modelCode}` });
            return;
          }

          const newProduct = await this.productRepo.save(
            this.productRepo.create({
              modelCode,
              displayName: item.displayName.trim(),
              categoryId,
              brand: item.brand?.trim(),
              spec: item.spec,
              unit: item.unit || 'EA',
              note: item.note,
              description: item.description,
              isActive: true,
            }),
          );
          created++;

          if (item.prices && item.prices.length > 0) {
            for (const priceItem of item.prices) {
              let vendor: Vendor | null = null;
              if (autoCreateVendor) {
                vendor = await this.vendorRepo.findOne({ where: { name: priceItem.vendor.trim() } });
                if (!vendor) {
                  vendor = await this.vendorRepo.save(this.vendorRepo.create({ name: priceItem.vendor.trim(), isActive: true, sortOrder: 0 }));
                }
              } else {
                vendor = await this.vendorRepo.findOne({ where: { name: priceItem.vendor.trim() } });
                if (!vendor) {
                  errors.push({ index, reason: `업체를 찾을 수 없습니다: "${priceItem.vendor}"` });
                  continue;
                }
              }
              await this.pricesService.upsert({ productId: newProduct.id, vendorId: vendor.id, price: priceItem.price, note: priceItem.note });
            }
          }
        }
      } catch (err) {
        errors.push({ index, reason: err.message });
      }
    };

    if (atomic) {
      await this.dataSource.transaction(async () => {
        for (let i = 0; i < dto.items.length; i++) {
          await processItem(dto.items[i], i);
        }
        if (errors.length > 0) {
          throw new BadRequestException(`임포트 중 ${errors.length}개 오류 발생`);
        }
      });
    } else {
      for (let i = 0; i < dto.items.length; i++) {
        await processItem(dto.items[i], i);
      }
    }

    return { created, updated, skipped, errors, total: dto.items.length };
  }
}
