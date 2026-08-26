import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { RecurringTransaction } from '../recurring-transactions/entities/recurring-transaction.entity';
import { CreateCategoryDto } from './dto/request/create-category.dto';

const FALLBACK_CATEGORY_NAME: Record<CategoryType, string> = {
  [CategoryType.EXPENSE]: '기타지출',
  [CategoryType.INCOME]: '기타수입',
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(RecurringTransaction)
    private readonly recurringRepo: Repository<RecurringTransaction>,
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

    const children = await this.categoryRepo.find({ where: { parentId: id } });
    const deletedIds = [id, ...children.map((c) => c.id)];

    const [txCount, recurringCount] = await Promise.all([
      this.txRepo.count({ where: { categoryId: In(deletedIds) } }),
      this.recurringRepo.count({ where: { categoryId: In(deletedIds) } }),
    ]);
    if (txCount > 0 || recurringCount > 0) {
      const fallback = await this.getOrCreateFallbackCategory(category.householdId, category.type, deletedIds);
      if (txCount > 0) await this.txRepo.update({ categoryId: In(deletedIds) }, { categoryId: fallback.id });
      if (recurringCount > 0) await this.recurringRepo.update({ categoryId: In(deletedIds) }, { categoryId: fallback.id });
    }

    await this.categoryRepo.delete({ parentId: id });
    await this.categoryRepo.remove(category);
  }

  /** 삭제되는 카테고리를 참조하던 거래를 재배정할 "기타" 카테고리 — 가구에 이미 있으면 재사용, 없으면 새로 생성 */
  private async getOrCreateFallbackCategory(householdId: number, type: CategoryType, excludeIds: number[]): Promise<Category> {
    const name = FALLBACK_CATEGORY_NAME[type];
    const existing = await this.categoryRepo.findOne({
      where: [
        { householdId, type, name, id: Not(In(excludeIds)) },
        { isBuiltin: true, householdId: IsNull(), type, name },
      ],
    });
    if (existing) return existing;
    return this.categoryRepo.save(
      this.categoryRepo.create({ householdId, type, name, icon: '📦', color: '#8E8E93', isBuiltin: false, sortOrder: 999 }),
    );
  }

  private async assertValidParent(parentId: number): Promise<void> {
    const parent = await this.categoryRepo.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('상위 카테고리를 찾을 수 없습니다.');
    if (parent.parentId) throw new BadRequestException('소분류 아래에는 소분류를 만들 수 없습니다.');
  }
}
