import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { SiteCategory } from '../site-categories/entities/site-category.entity';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';
import { AssignMappingsDto } from './dto/request/assign-mappings.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SiteCategory)
    private readonly siteCategoryRepository: Repository<SiteCategory>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { level: 'ASC', sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findTree(): Promise<object[]> {
    const allCategories = await this.categoryRepository.find({
      order: { level: 'ASC', sortOrder: 'ASC', name: 'ASC' },
    });

    const siteCategoryCounts = await this.siteCategoryRepository
      .createQueryBuilder('sc')
      .select('sc.unifiedCategoryId', 'categoryId')
      .addSelect('COUNT(sc.id)', 'count')
      .where('sc.unifiedCategoryId IS NOT NULL')
      .groupBy('sc.unifiedCategoryId')
      .getRawMany();

    const countMap = new Map<string, number>();
    siteCategoryCounts.forEach((row) => {
      countMap.set(row.categoryId, parseInt(row.count, 10));
    });

    const categoryMap = new Map<string, any>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        mappedSiteCategoryCount: countMap.get(cat.id) ?? 0,
        children: [],
      });
    });

    const roots: any[] = [];
    allCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    return category;
  }

  async findMappings(categoryId: string): Promise<SiteCategory[]> {
    await this.findOne(categoryId);
    return this.siteCategoryRepository.find({
      where: { unifiedCategoryId: categoryId },
      relations: ['site'],
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('상위 카테고리를 찾을 수 없습니다.');
    }

    const level = dto.parentId ? await this.calcLevel(dto.parentId) : 1;
    const category = this.categoryRepository.create({ ...dto, level });
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new BadRequestException('자기 자신을 상위 카테고리로 지정할 수 없습니다.');
      if (dto.parentId) {
        const parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
        if (!parent) throw new NotFoundException('상위 카테고리를 찾을 수 없습니다.');
      }
    }

    Object.assign(category, dto);
    if (dto.parentId !== undefined) {
      category.level = dto.parentId ? await this.calcLevel(dto.parentId) : 1;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    const hasChildren = await this.categoryRepository.count({ where: { parentId: id } });
    if (hasChildren > 0) throw new BadRequestException('하위 카테고리가 있어 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하세요.');

    await this.siteCategoryRepository.update({ unifiedCategoryId: id }, { unifiedCategoryId: null });
    await this.categoryRepository.remove(category);
  }

  async assignMappings(categoryId: string, dto: AssignMappingsDto): Promise<void> {
    await this.findOne(categoryId);
    if (dto.siteCategoryIds.length === 0) return;

    await this.siteCategoryRepository
      .createQueryBuilder()
      .update()
      .set({ unifiedCategoryId: categoryId })
      .whereInIds(dto.siteCategoryIds)
      .execute();
  }

  async removeMappings(categoryId: string, dto: AssignMappingsDto): Promise<void> {
    await this.findOne(categoryId);
    if (dto.siteCategoryIds.length === 0) return;

    await this.siteCategoryRepository
      .createQueryBuilder()
      .update()
      .set({ unifiedCategoryId: null })
      .where('unifiedCategoryId = :categoryId', { categoryId })
      .whereInIds(dto.siteCategoryIds)
      .execute();
  }

  private async calcLevel(parentId: string): Promise<number> {
    const parent = await this.categoryRepository.findOne({ where: { id: parentId } });
    return parent ? parent.level + 1 : 1;
  }
}
