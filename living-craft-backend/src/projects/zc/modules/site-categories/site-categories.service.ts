import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteCategory } from './entities/site-category.entity';
import { CategoryTreeResponseDto } from './dto';

@Injectable()
export class SiteCategoriesService {
  constructor(
    @InjectRepository(SiteCategory)
    private readonly siteCategoryRepository: Repository<SiteCategory>,
  ) {}

  /**
   * 전체 카테고리 목록
   */
  async findAll(): Promise<SiteCategory[]> {
    return await this.siteCategoryRepository.find({ relations: ['site'] });
  }

  /**
   * 사이트별 카테고리 목록
   */
  async findBySiteId(siteId: string): Promise<SiteCategory[]> {
    return await this.siteCategoryRepository.find({
      where: { siteId },
      relations: ['site'],
      order: { level: 'ASC', siteCategoryCode: 'ASC' },
    });
  }

  /**
   * 사이트별 카테고리 트리 구조
   */
  async findTreeBySiteId(siteId: string): Promise<CategoryTreeResponseDto[]> {
    const categories = await this.siteCategoryRepository.find({
      where: { siteId },
      order: { level: 'ASC', siteCategoryCode: 'ASC' },
    });

    // 제품 개수 조회
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.siteCategoryRepository
          .createQueryBuilder('cat')
          .leftJoin('cat.productListings', 'listing')
          .where('cat.id = :id', { id: cat.id })
          .getCount();

        return {
          ...cat,
          productCount,
          children: [],
        };
      }),
    );

    // 트리 구조 생성
    const categoryMap = new Map<string, CategoryTreeResponseDto>();
    categoriesWithCount.forEach((cat) => categoryMap.set(cat.id, cat));

    const rootCategories: CategoryTreeResponseDto[] = [];

    categoriesWithCount.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(cat);
        }
      } else {
        rootCategories.push(cat);
      }
    });

    return rootCategories;
  }

  /**
   * 카테고리 상세 조회
   */
  async findOne(id: string): Promise<SiteCategory> {
    const category = await this.siteCategoryRepository.findOne({
      where: { id },
      relations: ['site'],
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return category;
  }

  /**
   * 하위 카테고리 조회
   */
  async findChildren(parentId: string): Promise<SiteCategory[]> {
    return await this.siteCategoryRepository.find({
      where: { parentId },
      order: { siteCategoryCode: 'ASC' },
    });
  }

  /**
   * 사이트 코드와 카테고리 코드로 조회
   */
  async findBySiteCodeAndCategoryCode(
    siteId: string,
    siteCategoryCode: string,
  ): Promise<SiteCategory | null> {
    return await this.siteCategoryRepository.findOne({
      where: { siteId, siteCategoryCode },
    });
  }

  /**
   * 사이트 코드(dasis 등)로 사이트 ID 조회
   */
  async getSiteIdByCode(siteCode: string): Promise<string> {
    const result = await this.siteCategoryRepository
      .createQueryBuilder('cat')
      .innerJoin('cat.site', 'site')
      .where('site.code = :code', { code: siteCode })
      .select('site.id')
      .getRawOne();

    if (!result) {
      throw new NotFoundException(`사이트를 찾을 수 없습니다: ${siteCode}`);
    }

    return result.site_id;
  }
}
