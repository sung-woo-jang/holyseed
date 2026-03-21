import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '@modules/reviews/entities';
import { AdminReviewsQueryDto } from './dto/request';
import { AdminReviewListResponseDto } from './dto/response';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class AdminReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  /**
   * 리뷰 목록 조회 (관리자)
   */
  async findAll(
    query: AdminReviewsQueryDto,
  ): Promise<AdminReviewListResponseDto> {
    const { rating, serviceId, page = 1, limit = 20 } = query;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.service', 'service')
      .leftJoinAndSelect('review.customer', 'customer')
      .leftJoinAndSelect('review.reservation', 'reservation');

    // 평점 필터
    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    // 서비스 필터
    if (serviceId) {
      queryBuilder.andWhere('review.serviceId = :serviceId', { serviceId });
    }

    // 정렬 (최신순)
    queryBuilder.orderBy('review.createdAt', 'DESC');

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      items: reviews.map((review) => ({
        id: review.id.toString(),
        serviceName: review.service?.title || '',
        customerName: review.customer?.name || '',
        customerPhone: review.customer?.phone || '',
        reservationNumber: review.reservation?.reservationNumber || '',
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * 리뷰 삭제 (hard delete)
   */
  async delete(id: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(ERROR_MESSAGES.REVIEW.NOT_FOUND);
    }

    await this.reviewRepository.remove(review);
  }
}
