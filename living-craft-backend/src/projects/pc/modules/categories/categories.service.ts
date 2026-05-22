import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PcCategory } from './entities/category.entity';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { UpdateCategoryDto } from './dto/request/update-category.dto';

export interface CategoryTreeNode {
  id: number;
  name: string;
  parentId: number | null;
  sortOrder: number;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(PcCategory)
    private readonly repo: Repository<PcCategory>,
  ) {}

  async findAll(): Promise<PcCategory[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findTree(): Promise<CategoryTreeNode[]> {
    const all = await this.findAll();
    return this.buildTree(all, null);
  }

  async findOne(id: number): Promise<PcCategory> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<PcCategory> {
    if (dto.parentId) {
      const parent = await this.repo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('부모 카테고리를 찾을 수 없습니다.');
    }

    const existing = await this.repo.findOne({
      where: { parentId: dto.parentId || null, name: dto.name },
    });
    if (existing) throw new ConflictException('같은 부모 아래 동일한 이름의 카테고리가 이미 존재합니다.');

    const category = this.repo.create({
      ...dto,
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.repo.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<PcCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async delete(id: number): Promise<void> {
    const children = await this.repo.find({ where: { parentId: id } });
    if (children.length > 0) {
      throw new ConflictException('하위 카테고리가 존재합니다. 먼저 하위 카테고리를 삭제하세요.');
    }
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async reorder(items: { id: number; sortOrder: number }[]): Promise<void> {
    await Promise.all(items.map(({ id, sortOrder }) => this.repo.update(id, { sortOrder })));
  }

  async collectDescendantIds(rootId: number): Promise<number[]> {
    const all = await this.findAll();
    const ids: number[] = [rootId];
    const queue = [rootId];

    while (queue.length > 0) {
      const current = queue.shift();
      const children = all.filter((c) => c.parentId === current);
      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }

    return ids;
  }

  async findOrCreateByPath(path: string[]): Promise<PcCategory> {
    let parentId: number | null = null;
    let current: PcCategory | null = null;

    for (const name of path) {
      const found = await this.repo.findOne({ where: { parentId: parentId ?? IsNull(), name } });
      if (found) {
        current = found;
        parentId = found.id;
      } else {
        current = await this.repo.save(this.repo.create({ name, parentId: parentId ?? null, sortOrder: 0 }));
        parentId = current.id;
      }
    }

    return current;
  }

  private buildTree(items: PcCategory[], parentId: number | null): CategoryTreeNode[] {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((item) => ({
        id: item.id,
        name: item.name,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        children: this.buildTree(items, item.id),
      }));
  }
}
