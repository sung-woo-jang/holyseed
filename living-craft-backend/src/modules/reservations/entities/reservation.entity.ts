import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Customer } from '@modules/customers/entities';
import { Service } from '@modules/services/entities';

export enum ReservationStatus {
  /** 대기 - 고객이 예약 문의 생성 또는 관리자가 확인 대기 중 */
  PENDING = 'pending',
  /** 확정 - 관리자가 예약을 확정하고 시공 일정 지정 */
  CONFIRMED = 'confirmed',
  /** 완료 */
  COMPLETED = 'completed',
  /** 취소 */
  CANCELLED = 'cancelled',
}

@Entity('reservations')
export class Reservation extends BaseEntity {
  @ApiProperty({
    description: '예약 번호',
    example: '20240115-0001',
  })
  @Column({ name: 'reservation_number', unique: true, length: 20 })
  reservationNumber: string;

  @ApiProperty({
    description: '고객',
    type: () => Customer,
  })
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ApiProperty({
    description: '고객 ID',
    example: 1,
  })
  @Column({ name: 'customer_id' })
  customerId: number;

  @ApiProperty({
    description: '서비스',
    type: () => Service,
  })
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty({
    description: '서비스 ID',
    example: 1,
  })
  @Column({ name: 'service_id' })
  serviceId: number;

  @ApiProperty({
    description: '견적 날짜',
    example: '2024-01-15',
  })
  @Column({ name: 'estimate_date', type: 'date' })
  estimateDate: Date;

  @ApiProperty({
    description: '견적 시간',
    example: '18:00',
  })
  @Column({ name: 'estimate_time', length: 10 })
  estimateTime: string;

  @ApiPropertyOptional({
    description: '시공 날짜 (관리자가 견적 완료 후 지정)',
    example: '2024-01-20',
  })
  @Column({ name: 'construction_date', type: 'date', nullable: true })
  constructionDate: Date | null;

  @ApiPropertyOptional({
    description: '시공 시간 (null: 하루 종일 또는 미정)',
    example: '09:00',
  })
  @Column({ name: 'construction_time', length: 10, nullable: true })
  constructionTime: string | null;

  @ApiPropertyOptional({
    description: '예약 확정 일시',
    example: '2024-01-16T10:30:00.000Z',
  })
  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({
    description: '도로명 주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  @Column({ length: 500 })
  address: string;

  @ApiProperty({
    description: '상세 주소',
    example: '2층 201호',
  })
  @Column({ name: 'detail_address', length: 200 })
  detailAddress: string;

  @ApiProperty({
    description: '고객 이름',
    example: '홍길동',
  })
  @Column({ name: 'customer_name', length: 100 })
  customerName: string;

  @ApiProperty({
    description: '고객 전화번호',
    example: '010-1234-5678',
  })
  @Column({ name: 'customer_phone', length: 20 })
  customerPhone: string;

  @ApiPropertyOptional({
    description: '메모',
    example: '주차 공간 없음',
  })
  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @ApiPropertyOptional({
    description: '첨부 사진 URL 목록',
    example: ['https://example.com/photo1.jpg'],
  })
  @Column({ type: 'simple-array', nullable: true })
  photos: string[] | null;

  @ApiProperty({
    description: '예약 상태',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ApiPropertyOptional({
    description: '취소 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;
}
