import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '@modules/customers/entities';
import { Reservation, ReservationStatus } from '@modules/reservations/entities';
import { Review } from '@modules/reviews/entities';
import { AdminCustomersQueryDto } from './dto/request';
import {
  AdminCustomerListResponseDto,
  AdminCustomerDetailDto,
} from './dto/response';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class AdminCustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  /**
   * 고객 목록 조회 (관리자)
   */
  async findAll(
    query: AdminCustomersQueryDto,
  ): Promise<AdminCustomerListResponseDto> {
    const { search, page = 1, limit = 20 } = query;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere(
        '(customer.name LIKE :search OR customer.phone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 정렬 (최신순)
    queryBuilder.orderBy('customer.createdAt', 'DESC');

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [customers, total] = await queryBuilder.getManyAndCount();

    // 각 고객의 예약/리뷰 수 계산
    const items = await Promise.all(
      customers.map(async (customer) => {
        const totalReservations = await this.reservationRepository.count({
          where: { customerId: customer.id },
        });
        const totalReviews = await this.reviewRepository.count({
          where: { customerId: customer.id },
        });

        return {
          id: customer.id.toString(),
          name: customer.name,
          phone: customer.phone,
          totalReservations,
          totalReviews,
          createdAt: customer.createdAt.toISOString(),
        };
      }),
    );

    return { items, total };
  }

  /**
   * 고객 상세 조회 (관리자)
   */
  async findById(id: number): Promise<AdminCustomerDetailDto> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(ERROR_MESSAGES.CUSTOMER.NOT_FOUND);
    }

    // 예약 목록 조회
    const reservations = await this.reservationRepository.find({
      where: { customerId: id },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });

    // 리뷰 목록 조회
    const reviews = await this.reviewRepository.find({
      where: { customerId: id },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });

    // 예약에 리뷰가 있는지 확인
    const reviewedReservationIds = new Set(reviews.map((r) => r.reservationId));

    return {
      id: customer.id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      reservations: reservations.map((reservation) => ({
        id: reservation.id.toString(),
        reservationNumber: reservation.reservationNumber,
        serviceName: reservation.service?.title || '',
        estimateDate: this.formatDate(reservation.estimateDate),
        estimateTime: reservation.estimateTime,
        constructionDate: this.formatDate(reservation.constructionDate),
        constructionTime: reservation.constructionTime,
        status: reservation.status,
        canCancel:
          reservation.status === ReservationStatus.PENDING ||
          reservation.status === ReservationStatus.CONFIRMED,
        canReview:
          reservation.status === ReservationStatus.COMPLETED &&
          !reviewedReservationIds.has(reservation.id),
      })),
      reviews: reviews.map((review) => ({
        id: review.id.toString(),
        serviceName: review.service?.title || '',
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      })),
      createdAt: customer.createdAt.toISOString(),
    };
  }

  /**
   * 날짜 포맷팅 헬퍼
   */
  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
}
