import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '@modules/portfolios/entities';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  AdminPortfoliosQueryDto,
} from './dto/request';
import { FilesService } from '@modules/files/files.service';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class AdminPortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly filesService: FilesService,
  ) {}

  /**
   * 포트폴리오 목록 조회 (관리자)
   */
  async findAll(query: AdminPortfoliosQueryDto): Promise<{
    items: Portfolio[];
    total: number;
  }> {
    const { category, page = 1, limit = 20 } = query;

    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    const [items, total] = await this.portfolioRepository.findAndCount({
      where: whereClause,
      relations: ['service'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  /**
   * 포트폴리오 상세 조회
   */
  async findById(id: number): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!portfolio) {
      throw new NotFoundException(ERROR_MESSAGES.PORTFOLIO.NOT_FOUND);
    }

    return portfolio;
  }

  /**
   * 포트폴리오 생성
   */
  async create(
    dto: CreatePortfolioDto,
    imageFiles: Express.Multer.File[],
  ): Promise<Portfolio> {
    // 이미지 업로드
    let imageUrls: string[];
    try {
      const uploadResults = await Promise.all(
        imageFiles.map((file) =>
          this.filesService.uploadImage(file, 'portfolio'),
        ),
      );
      imageUrls = uploadResults.map((result) => result.url);
    } catch (error) {
      throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
    }

    // 포트폴리오 생성
    try {
      const portfolio = this.portfolioRepository.create({
        category: dto.category,
        projectName: dto.projectName,
        client: dto.client,
        duration: dto.duration,
        description: dto.description,
        detailedDescription: dto.detailedDescription,
        images: imageUrls,
        tags: dto.tags || [],
        serviceId: dto.relatedServiceId,
      });

      const savedPortfolio = await this.portfolioRepository.save(portfolio);
      return this.findById(savedPortfolio.id);
    } catch (error) {
      // 롤백
      if (imageUrls && imageUrls.length > 0) {
        await this.cleanupUploadedFiles(imageUrls);
      }
      throw error;
    }
  }

  /**
   * 포트폴리오 수정
   */
  async update(
    id: number,
    dto: UpdatePortfolioDto,
    imageFiles?: Express.Multer.File[],
  ): Promise<Portfolio> {
    const portfolio = await this.findById(id);
    const oldImages = [...portfolio.images];

    try {
      // 새 이미지가 있으면 업로드 및 기존 이미지 교체
      if (imageFiles && imageFiles.length > 0) {
        const uploadResults = await Promise.all(
          imageFiles.map((file) =>
            this.filesService.uploadImage(file, 'portfolio'),
          ),
        );
        const newImageUrls = uploadResults.map((result) => result.url);

        // 기존 이미지 삭제
        await this.cleanupUploadedFiles(oldImages);

        portfolio.images = newImageUrls;
      }

      // 기타 필드 업데이트
      if (dto.category !== undefined) portfolio.category = dto.category;
      if (dto.projectName !== undefined)
        portfolio.projectName = dto.projectName;
      if (dto.client !== undefined) portfolio.client = dto.client;
      if (dto.duration !== undefined) portfolio.duration = dto.duration;
      if (dto.description !== undefined)
        portfolio.description = dto.description;
      if (dto.detailedDescription !== undefined)
        portfolio.detailedDescription = dto.detailedDescription;
      if (dto.tags !== undefined) portfolio.tags = dto.tags;
      if (dto.relatedServiceId !== undefined)
        portfolio.serviceId = dto.relatedServiceId;

      await this.portfolioRepository.save(portfolio);
      return this.findById(id);
    } catch (error) {
      // 실패 시 새 이미지만 정리
      if (imageFiles && imageFiles.length > 0 && portfolio.images !== oldImages) {
        await this.cleanupUploadedFiles(portfolio.images);
      }
      throw error;
    }
  }

  /**
   * 포트폴리오 삭제 (soft delete)
   */
  async delete(id: number): Promise<void> {
    const portfolio = await this.findById(id);
    portfolio.isActive = false;
    await this.portfolioRepository.save(portfolio);
  }

  /**
   * 업로드된 파일 정리 (롤백용)
   */
  private async cleanupUploadedFiles(urls: string[]): Promise<void> {
    try {
      await Promise.all(
        urls.map((url) => {
          const s3Key = this.filesService.getFilePathFromUrl(url);
          return this.filesService.deleteFile(s3Key);
        }),
      );
    } catch (error) {
      console.error('파일 정리 중 오류 발생:', error);
      // 에러를 던지지 않음 (메인 트랜잭션 실패가 더 중요)
    }
  }
}
