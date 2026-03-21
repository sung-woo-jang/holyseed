import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities';
import { CreateReviewDto, ReviewsQueryDto } from './dto/request';
import {
  CreateReviewResponseDto,
  ReviewListResponseDto,
  MyReviewListResponseDto,
} from './dto/response';
import { Reservation, ReservationStatus } from '@modules/reservations/entities';
import { FilesService } from '@modules/files/files.service';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly filesService: FilesService,
  ) {}

  /**
   * 리뷰 작성
   */
  async create(
    dto: CreateReviewDto,
    imageFiles: Express.Multer.File[],
    customerId: number,
  ): Promise<CreateReviewResponseDto> {
    const reservationId = parseInt(dto.reservationId);

    // 예약 조회
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['service'],
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    // 본인 예약인지 확인
    if (reservation.customerId !== customerId) {
      throw new ForbiddenException(ERROR_MESSAGES.REVIEW.FORBIDDEN_CREATE);
    }

    // 완료된 예약인지 확인
    if (reservation.status !== ReservationStatus.COMPLETED) {
      throw new BadRequestException(
        ERROR_MESSAGES.REVIEW.ONLY_COMPLETED_RESERVATION,
      );
    }

    // 이미 리뷰가 있는지 확인
    const existingReview = await this.reviewRepository.findOne({
      where: { reservationId },
    });

    if (existingReview) {
      throw new BadRequestException(ERROR_MESSAGES.REVIEW.ALREADY_REVIEWED);
    }

    // 이미지 업로드 처리
    let imageUrls: string[] | null = null;
    if (imageFiles && imageFiles.length > 0) {
      try {
        const uploadResults = await Promise.all(
          imageFiles.map((file) =>
            this.filesService.uploadImage(file, 'reviews'),
          ),
        );
        imageUrls = uploadResults.map((result) => result.url);
      } catch (error) {
        throw new BadRequestException(`이미지 업로드 실패: ${error.message}`);
      }
    }

    // 리뷰 생성
    try {
      const review = this.reviewRepository.create({
        reservationId,
        customerId,
        serviceId: reservation.serviceId,
        rating: dto.rating,
        comment: dto.comment,
        images: imageUrls,
      });

      const saved = await this.reviewRepository.save(review);

      return {
        id: saved.id.toString(),
        rating: saved.rating,
        comment: saved.comment,
        createdAt: saved.createdAt.toISOString(),
      };
    } catch (error) {
      // 실패 시 업로드된 파일 롤백
      if (imageUrls && imageUrls.length > 0) {
        await this.cleanupUploadedFiles(imageUrls);
      }
      throw error;
    }
  }

  /**
   * 리뷰 목록 조회 (공개)
   */
  async findAll(query: ReviewsQueryDto): Promise<ReviewListResponseDto> {
    const whereClause: any = {};

    if (query.rating) {
      whereClause.rating = query.rating;
    }

    if (query.serviceId) {
      whereClause.serviceId = parseInt(query.serviceId);
    }

    const [items, total] = await this.reviewRepository.findAndCount({
      where: whereClause,
      relations: ['service', 'customer'],
      order: { createdAt: 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    // 평균 평점 계산
    const avgResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where(whereClause)
      .getRawOne();

    const averageRating = avgResult?.avg
      ? Math.round(parseFloat(avgResult.avg) * 10) / 10
      : undefined;

    return {
      items: items.map((review) => ({
        id: review.id.toString(),
        userName: this.maskName(review.customer?.name || '익명'),
        service: {
          id: review.service.id.toString(),
          title: review.service.title,
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      })),
      total,
      averageRating,
    };
  }

  /**
   * 내 리뷰 목록 조회
   */
  async findMyReviews(
    customerId: number,
    limit: number = 10,
    offset: number = 0,
  ): Promise<MyReviewListResponseDto> {
    const [items, total] = await this.reviewRepository.findAndCount({
      where: { customerId },
      relations: ['service'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      items: items.map((review) => ({
        id: review.id.toString(),
        service: {
          id: review.service.id.toString(),
          title: review.service.title,
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * 이름 마스킹 (홍길동 -> 홍*동)
   */
  private maskName(name: string): string {
    if (!name || name.length < 2) {
      return name || '익명';
    }

    if (name.length === 2) {
      return name[0] + '*';
    }

    const first = name[0];
    const last = name[name.length - 1];
    const middle = '*'.repeat(name.length - 2);

    return first + middle + last;
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
