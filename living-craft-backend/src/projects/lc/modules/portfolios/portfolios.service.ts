import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities';
import { PortfoliosQueryDto } from './dto/request';
import { PortfolioListResponseDto, PortfolioDetailDto } from './dto/response';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  /**
   * 포트폴리오 목록 조회
   */
  async findAll(query: PortfoliosQueryDto): Promise<PortfolioListResponseDto> {
    const whereClause: any = { isActive: true };

    if (query.category) {
      whereClause.category = query.category;
    }

    const [items, total] = await this.portfolioRepository.findAndCount({
      where: whereClause,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      items: items.map((portfolio) => ({
        id: portfolio.id.toString(),
        category: portfolio.category,
        projectName: portfolio.projectName,
        description: portfolio.description,
        thumbnailImage: portfolio.images?.[0] || '',
        tags: portfolio.tags,
      })),
      total,
    };
  }

  /**
   * 포트폴리오 상세 조회
   */
  async findById(id: number): Promise<PortfolioDetailDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, isActive: true },
    });

    if (!portfolio) {
      throw new NotFoundException(ERROR_MESSAGES.PORTFOLIO.NOT_FOUND);
    }

    return {
      id: portfolio.id.toString(),
      category: portfolio.category,
      projectName: portfolio.projectName,
      client: portfolio.client,
      duration: portfolio.duration,
      detailedDescription: portfolio.detailedDescription,
      images: portfolio.images || [],
      tags: portfolio.tags,
      relatedServiceId: portfolio.serviceId.toString(),
    };
  }
}
