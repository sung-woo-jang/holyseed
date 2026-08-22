import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/request/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findByHousehold(householdId: number): Promise<Category[]> {
    return this.categoryRepo.find({
      where: [{ householdId }, { isBuiltin: true, householdId: IsNull() }],
      order: { isBuiltin: 'DESC', sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async create(householdId: number, dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) await this.assertValidParent(dto.parentId);
    const category = this.categoryRepo.create({ ...dto, householdId, isBuiltin: false });
    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: Partial<CreateCategoryDto>): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    if (dto.parentId) await this.assertValidParent(dto.parentId);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async delete(id: number): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    if (category.isBuiltin) throw new NotFoundException('기본 카테고리는 삭제할 수 없습니다.');
    await this.categoryRepo.delete({ parentId: id });
    await this.categoryRepo.remove(category);
  }

  private async assertValidParent(parentId: number): Promise<void> {
    const parent = await this.categoryRepo.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('상위 카테고리를 찾을 수 없습니다.');
    if (parent.parentId) throw new BadRequestException('소분류 아래에는 소분류를 만들 수 없습니다.');
  }
}
