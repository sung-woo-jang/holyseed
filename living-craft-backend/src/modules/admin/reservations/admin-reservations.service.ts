import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '@modules/reservations/entities';
import {
  AdminReservationsQueryDto,
  UpdateReservationStatusDto,
  AdminReservationStatusUpdate,
} from './dto/request';
import { AdminReservationListResponseDto } from './dto/response';
import { ERROR_MESSAGES } from '@common/constants';

@Injectable()
export class AdminReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  /**
   * 예약 상세 조회 (관리자)
   */
  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['service', 'customer'],
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    return reservation;
  }

  /**
   * 전체 예약 목록 조회 (관리자)
   */
  async findAll(
    query: AdminReservationsQueryDto,
  ): Promise<AdminReservationListResponseDto> {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = query;

    const queryBuilder = this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.service', 'service')
      .leftJoinAndSelect('reservation.customer', 'customer');

    // 상태 필터
    if (status) {
      queryBuilder.andWhere('reservation.status = :status', { status });
    }

    // 날짜 범위 필터 (견적 날짜 기준)
    if (startDate && endDate) {
      queryBuilder.andWhere(
        'reservation.estimateDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    } else if (startDate) {
      queryBuilder.andWhere('reservation.estimateDate >= :startDate', {
        startDate,
      });
    } else if (endDate) {
      queryBuilder.andWhere('reservation.estimateDate <= :endDate', {
        endDate,
      });
    }

    // 검색어 필터 (이름, 전화번호)
    if (search) {
      queryBuilder.andWhere(
        '(reservation.customerName LIKE :search OR reservation.customerPhone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 정렬 (최신순)
    queryBuilder.orderBy('reservation.createdAt', 'DESC');

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [reservations, total] = await queryBuilder.getManyAndCount();

    return {
      items: reservations.map((reservation) => ({
        id: reservation.id.toString(),
        reservationNumber: reservation.reservationNumber,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        serviceName: reservation.service?.title || '',
        estimateDate: this.formatDate(reservation.estimateDate),
        estimateTime: reservation.estimateTime,
        constructionDate: this.formatDate(reservation.constructionDate),
        constructionTime: reservation.constructionTime,
        address: reservation.address,
        status: reservation.status,
        createdAt: reservation.createdAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * 예약 상태 변경 (관리자)
   */
  async updateStatus(
    id: number,
    dto: UpdateReservationStatusDto,
  ): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    const now = new Date();

    switch (dto.status) {
      case AdminReservationStatusUpdate.CONFIRMED:
        reservation.status = ReservationStatus.CONFIRMED;
        reservation.confirmedAt = now;
        break;
      case AdminReservationStatusUpdate.COMPLETED:
        reservation.status = ReservationStatus.COMPLETED;
        break;
      case AdminReservationStatusUpdate.CANCELLED:
        reservation.status = ReservationStatus.CANCELLED;
        reservation.cancelledAt = now;
        break;
    }

    await this.reservationRepository.save(reservation);
  }

  /**
   * 예약 취소 (관리자)
   */
  async cancel(id: number): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(ERROR_MESSAGES.RESERVATION.NOT_FOUND);
    }

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();

    await this.reservationRepository.save(reservation);
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
