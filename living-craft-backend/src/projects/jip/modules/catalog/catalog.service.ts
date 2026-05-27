import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { ServiceItem } from './entities/service-item.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin-category.dto';
import { AdminItemListDto, CreateItemDto, UpdateItemDto } from './dto/admin-item.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
    @InjectRepository(ServiceItem) private readonly itemRepo: Repository<ServiceItem>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

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
      relations: ['category'],
    });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);

    const pcProducts = await this.dataSource.query(
      `SELECT p.id, p.code, p.model_code AS "modelCode",
              p.display_name AS name, p.primary_image_url AS "imageUrl",
              p.representative_price AS price, p.spec, p.brand,
              p.description, p.illust_kind AS "illustKind",
              p.sort_order AS "sortOrder", p.is_active AS "isActive"
       FROM jip.pc_products p
       WHERE p.service_item_id = $1 AND p.is_active = true
       ORDER BY p.sort_order ASC, p.display_name ASC`,
      [item.id],
    );

    if (pcProducts.length > 0) {
      for (const p of pcProducts) {
        const images = await this.dataSource.query(
          `SELECT url AS "fileUrl", role, label, is_primary AS "isPrimary", sort_order AS "sortOrder"
           FROM jip.pc_product_images WHERE product_id = $1 ORDER BY sort_order ASC, is_primary DESC`,
          [p.id],
        );
        p.photos = images;
        p.imageUrl = p.imageUrl || images.find((i) => i.isPrimary)?.fileUrl || images[0]?.fileUrl || null;
      }
    }

    return { ...item, products: pcProducts, productGroups: [] };
  }

  async getProductByCode(code: string) {
    const pcProduct = await this.dataSource.query(
      `SELECT p.id, p.code, p.model_code AS "modelCode",
              p.display_name AS name, p.primary_image_url AS "imageUrl",
              p.representative_price AS price, p.spec, p.brand,
              p.description, p.illust_kind AS "illustKind",
              p.sort_order AS "sortOrder", p.is_active AS "isActive",
              p.service_item_id AS "serviceItemId"
       FROM jip.pc_products p
       WHERE p.code = $1 AND p.is_active = true`,
      [code],
    );

    if (pcProduct.length === 0) throw new NotFoundException(`제품 '${code}'를 찾을 수 없어요.`);

    const p = pcProduct[0];
    const [photos, features, colors, siRows] = await Promise.all([
      this.dataSource.query(
        `SELECT url AS "fileUrl", role, label, sort_order AS "sortOrder"
         FROM jip.pc_product_images WHERE product_id = $1 ORDER BY sort_order ASC`,
        [p.id],
      ),
      this.dataSource.query(
        `SELECT label, sort_order AS "sortOrder" FROM jip.pc_product_features WHERE product_id = $1 ORDER BY sort_order ASC`,
        [p.id],
      ),
      this.dataSource.query(
        `SELECT label, sort_order AS "sortOrder" FROM jip.pc_product_colors WHERE product_id = $1 ORDER BY sort_order ASC`,
        [p.id],
      ),
      p.serviceItemId
        ? this.dataSource.query(
            `SELECT si.id, si.code, si.name, si.price, si.illust_kind AS "illustKind",
                    cat.id AS "catId", cat.code AS "catCode", cat.name AS "catName"
             FROM jip.service_items si
             LEFT JOIN jip.categories cat ON cat.id = si.category_id
             WHERE si.id = $1`,
            [p.serviceItemId],
          )
        : Promise.resolve([]),
    ]);

    const serviceItem = siRows[0]
      ? {
          id: siRows[0].id,
          code: siRows[0].code,
          name: siRows[0].name,
          price: siRows[0].price,
          illustKind: siRows[0].illustKind,
          category: siRows[0].catId
            ? { id: siRows[0].catId, code: siRows[0].catCode, name: siRows[0].catName }
            : null,
        }
      : null;

    return { ...p, photos, features, colors, serviceItem };
  }

  async getFeaturedItems() {
    return this.itemRepo.find({
      where: { isFeatured: true, isActive: true },
      relations: ['category'],
      order: { sortOrder: 'ASC' },
    });
  }

  async updateCategoryImage(code: string, imageUrl: string) {
    const cat = await this.catRepo.findOne({ where: { code } });
    if (!cat) throw new NotFoundException(`카테고리 '${code}'를 찾을 수 없어요.`);
    cat.imageUrl = imageUrl;
    return this.catRepo.save(cat);
  }

  async updateItemImage(code: string, imageUrl: string) {
    const item = await this.itemRepo.findOne({ where: { code } });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);
    item.imageUrl = imageUrl;
    return this.itemRepo.save(item);
  }

  // ──────────────── Admin Category ────────────────

  async adminListCategories() {
    return this.catRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async adminGetCategory(code: string) {
    const cat = await this.catRepo.findOne({ where: { code } });
    if (!cat) throw new NotFoundException(`카테고리 '${code}'를 찾을 수 없어요.`);
    return cat;
  }

  async createCategory(dto: CreateCategoryDto) {
    const cat = this.catRepo.create({
      code: dto.code,
      name: dto.name,
      intro: dto.intro ?? null,
      color: dto.color ?? 'default',
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.catRepo.save(cat);
  }

  async updateCategory(code: string, dto: UpdateCategoryDto) {
    const cat = await this.catRepo.findOne({ where: { code } });
    if (!cat) throw new NotFoundException(`카테고리 '${code}'를 찾을 수 없어요.`);
    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.intro !== undefined) cat.intro = dto.intro;
    if (dto.color !== undefined) cat.color = dto.color;
    if (dto.sortOrder !== undefined) cat.sortOrder = dto.sortOrder;
    return this.catRepo.save(cat);
  }

  async toggleCategoryActive(code: string, isActive: boolean) {
    const cat = await this.catRepo.findOne({ where: { code } });
    if (!cat) throw new NotFoundException(`카테고리 '${code}'를 찾을 수 없어요.`);
    cat.isActive = isActive;
    return this.catRepo.save(cat);
  }

  async softDeleteCategory(code: string) {
    const cat = await this.catRepo.findOne({ where: { code } });
    if (!cat) throw new NotFoundException(`카테고리 '${code}'를 찾을 수 없어요.`);
    cat.isActive = false;
    await this.catRepo.save(cat);
  }

  // ──────────────── Admin ServiceItem ────────────────

  async adminListItems(dto: AdminItemListDto) {
    const qb = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'cat');
    if (dto.categoryCode) {
      qb.where('cat.code = :code', { code: dto.categoryCode });
    }
    return qb.orderBy('cat.sortOrder', 'ASC').addOrderBy('item.sortOrder', 'ASC').getMany();
  }

  async adminGetItem(code: string) {
    const item = await this.itemRepo.findOne({
      where: { code },
      relations: ['category'],
    });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);

    const pcProducts = await this.dataSource.query(
      `SELECT p.id, p.code, p.model_code AS "modelCode", p.display_name AS name,
              p.primary_image_url AS "imageUrl", p.representative_price AS price,
              p.spec, p.brand, p.is_active AS "isActive", p.sort_order AS "sortOrder"
       FROM jip.pc_products p
       WHERE p.service_item_id = $1
       ORDER BY p.sort_order ASC, p.display_name ASC`,
      [item.id],
    );

    return { ...item, products: pcProducts };
  }

  async createItem(dto: CreateItemDto) {
    const cat = await this.catRepo.findOne({ where: { code: dto.categoryCode } });
    if (!cat) throw new NotFoundException(`카테고리 '${dto.categoryCode}'를 찾을 수 없어요.`);
    return this.itemRepo.save(this.itemRepo.create({
      categoryId: cat.id,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      unit: dto.unit,
      duration: dto.duration,
      illustKind: dto.illustKind ?? 'default',
      isFeatured: dto.isFeatured ?? false,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    }));
  }

  async updateItem(code: string, dto: UpdateItemDto) {
    const item = await this.itemRepo.findOne({ where: { code } });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.price !== undefined) item.price = dto.price;
    if (dto.unit !== undefined) item.unit = dto.unit;
    if (dto.duration !== undefined) item.duration = dto.duration;
    if (dto.illustKind !== undefined) item.illustKind = dto.illustKind;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;
    return this.itemRepo.save(item);
  }

  async toggleItemActive(code: string, isActive: boolean) {
    const item = await this.itemRepo.findOne({ where: { code } });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);
    item.isActive = isActive;
    return this.itemRepo.save(item);
  }

  async toggleItemFeatured(code: string, isFeatured: boolean) {
    const item = await this.itemRepo.findOne({ where: { code } });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);
    item.isFeatured = isFeatured;
    return this.itemRepo.save(item);
  }

  async softDeleteItem(code: string) {
    const item = await this.itemRepo.findOne({ where: { code } });
    if (!item) throw new NotFoundException(`서비스 항목 '${code}'를 찾을 수 없어요.`);
    item.isActive = false;
    await this.itemRepo.save(item);
  }

  // ──────────────── Admin PC Product (view via catalog) ────────────────

  async adminListProducts(dto: { itemCode?: string; search?: string }) {
    let itemId: number | null = null;
    if (dto.itemCode) {
      const si = await this.itemRepo.findOne({ where: { code: dto.itemCode } });
      if (si) itemId = si.id;
    }

    const params: any[] = [];
    let where = `WHERE p.service_item_id IS NOT NULL`;
    if (itemId) {
      params.push(itemId);
      where += ` AND p.service_item_id = $${params.length}`;
    }
    if (dto.search) {
      params.push(`%${dto.search}%`);
      where += ` AND (p.code ILIKE $${params.length} OR p.display_name ILIKE $${params.length} OR p.model_code ILIKE $${params.length})`;
    }

    return this.dataSource.query(
      `SELECT p.id, p.code, p.model_code AS "modelCode",
              p.display_name AS name, p.primary_image_url AS "imageUrl",
              p.representative_price AS price, p.brand, p.spec,
              p.is_active AS "isActive", p.sort_order AS "sortOrder",
              p.service_item_id AS "serviceItemId",
              si.code AS "itemCode", si.name AS "itemName",
              cat.code AS "categoryCode", cat.name AS "categoryName"
       FROM jip.pc_products p
       LEFT JOIN jip.service_items si ON si.id = p.service_item_id
       LEFT JOIN jip.categories cat ON cat.id = si.category_id
       ${where}
       ORDER BY cat.sort_order ASC NULLS LAST, si.sort_order ASC NULLS LAST, p.sort_order ASC`,
      params,
    );
  }

  async adminGetProduct(code: string) {
    const pcRows = await this.dataSource.query(
      `SELECT p.id, p.code, p.model_code AS "modelCode",
              p.display_name AS name, p.primary_image_url AS "imageUrl",
              p.representative_price AS price, p.spec, p.brand,
              p.description, p.illust_kind AS "illustKind",
              p.sort_order AS "sortOrder", p.is_active AS "isActive",
              p.service_item_id AS "serviceItemId",
              si.code AS "itemCode", si.name AS "itemName"
       FROM jip.pc_products p
       LEFT JOIN jip.service_items si ON si.id = p.service_item_id
       WHERE p.code = $1`,
      [code],
    );

    if (pcRows.length === 0) throw new NotFoundException(`제품 '${code}'를 찾을 수 없어요.`);
    const p = pcRows[0];

    const [photos, features, colors] = await Promise.all([
      this.dataSource.query(
        `SELECT id, url AS "fileUrl", role, label, sort_order AS "sortOrder"
         FROM jip.pc_product_images WHERE product_id = $1 ORDER BY sort_order ASC`,
        [p.id],
      ),
      this.dataSource.query(
        `SELECT id, label, sort_order AS "sortOrder" FROM jip.pc_product_features WHERE product_id = $1 ORDER BY sort_order ASC`,
        [p.id],
      ),
      this.dataSource.query(
        `SELECT id, label, sort_order AS "sortOrder" FROM jip.pc_product_colors WHERE product_id = $1 ORDER BY sort_order ASC`,
        [p.id],
      ),
    ]);

    return { ...p, photos, features, colors };
  }
}
