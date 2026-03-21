import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Or,
  Repository,
} from 'typeorm';
import { Promotion } from './entities';
import {
  CreatePromotionDto,
  ReorderPromotionsDto,
  UpdatePromotionDto,
} from './dto';
import { Icon } from '@modules/icons/entities/icon.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    @InjectRepository(Icon)
    private readonly iconRepository: Repository<Icon>,
  ) {}

  // ============================================
  // Public API (Front용)
  // ============================================

  /**
   * 활성 프로모션 목록 조회 (게시 기간 필터 적용)
   */
  async findActivePromotions(): Promise<Promotion[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.promotionRepository.find({
      where: {
        isActive: true,
        // 시작일이 없거나 오늘 이전이고, 종료일이 없거나 오늘 이후
        startDate: Or(IsNull(), LessThanOrEqual(new Date(today))),
        endDate: Or(IsNull(), MoreThanOrEqual(new Date(today))),
      },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 클릭 수 증가
   */
  async incrementClickCount(id: number): Promise<void> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('프로모션을 찾을 수 없습니다.');
    }

    await this.promotionRepository.increment({ id }, 'clickCount', 1);
  }

  // ============================================
  // Admin API
  // ============================================

  /**
   * 전체 프로모션 목록 조회 (관리자)
   */
  async findAll(): Promise<Promotion[]> {
    return this.promotionRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 프로모션 상세 조회
   */
  async findById(id: number): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
    });

    if (!promotion) {
      throw new NotFoundException('프로모션을 찾을 수 없습니다.');
    }

    return promotion;
  }

  /**
   * 프로모션 생성
   */
  async create(dto: CreatePromotionDto): Promise<Promotion> {
    // 아이콘 존재 여부 확인
    const icon = await this.iconRepository.findOne({
      where: { id: dto.iconId },
    });

    if (!icon) {
      throw new NotFoundException('아이콘을 찾을 수 없습니다.');
    }

    // 다음 정렬 순서 계산
    const lastPromotion = await this.promotionRepository.findOne({
      order: { sortOrder: 'DESC' },
      where: {},
    });
    const nextSortOrder = dto.sortOrder ?? (lastPromotion?.sortOrder ?? 0) + 1;

    const promotion = this.promotionRepository.create({
      title: dto.title,
      subtitle: dto.subtitle,
      iconId: dto.iconId,
      iconBgColor: dto.iconBgColor,
      iconColor: dto.iconColor,
      linkUrl: dto.linkUrl,
      linkType: dto.linkType,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive ?? true,
      sortOrder: nextSortOrder,
    });

    return this.promotionRepository.save(promotion);
  }

  /**
   * 프로모션 수정
   */
  async update(id: number, dto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findById(id);

    // 아이콘이 변경되면 존재 여부 확인
    if (dto.iconId !== undefined) {
      const icon = await this.iconRepository.findOne({
        where: { id: dto.iconId },
      });

      if (!icon) {
        throw new NotFoundException('아이콘을 찾을 수 없습니다.');
      }
      promotion.iconId = dto.iconId;
    }

    // 필드 업데이트
    if (dto.title !== undefined) promotion.title = dto.title;
    if (dto.subtitle !== undefined) promotion.subtitle = dto.subtitle;
    if (dto.iconBgColor !== undefined) promotion.iconBgColor = dto.iconBgColor;
    if (dto.iconColor !== undefined) promotion.iconColor = dto.iconColor;
    if (dto.linkUrl !== undefined) promotion.linkUrl = dto.linkUrl;
    if (dto.linkType !== undefined) promotion.linkType = dto.linkType;
    if (dto.startDate !== undefined)
      promotion.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      promotion.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) promotion.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) promotion.sortOrder = dto.sortOrder;

    return this.promotionRepository.save(promotion);
  }

  /**
   * 프로모션 삭제
   */
  async delete(id: number): Promise<void> {
    const promotion = await this.findById(id);
    await this.promotionRepository.remove(promotion);
  }

  /**
   * 활성/비활성 토글
   */
  async toggle(id: number): Promise<Promotion> {
    const promotion = await this.findById(id);
    promotion.isActive = !promotion.isActive;
    return this.promotionRepository.save(promotion);
  }

  /**
   * 정렬 순서 변경
   */
  async reorder(dto: ReorderPromotionsDto): Promise<Promotion[]> {
    const updates = dto.items.map(async (item) => {
      await this.promotionRepository.update(item.id, {
        sortOrder: item.sortOrder,
      });
    });

    await Promise.all(updates);
    return this.findAll();
  }
}
