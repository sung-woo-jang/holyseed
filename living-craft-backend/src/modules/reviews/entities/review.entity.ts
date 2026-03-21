import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Customer } from '@modules/customers/entities';
import { Service } from '@modules/services/entities';
import { Reservation } from '@modules/reservations/entities';

@Entity('reviews')
export class Review extends BaseEntity {
  @ApiProperty({
    description: '예약',
    type: () => Reservation,
  })
  @OneToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ApiProperty({
    description: '예약 ID',
    example: 1,
  })
  @Column({ name: 'reservation_id', unique: true })
  reservationId: number;

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
    description: '평점 (1-5)',
    example: 5,
  })
  @Column({ type: 'int' })
  rating: number;

  @ApiProperty({
    description: '리뷰 내용',
    example: '친절하고 깔끔하게 시공해주셨습니다.',
  })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({
    description: '리뷰 이미지 URL 목록',
    example: ['https://kr.object.ncloudstorage.com/living-craft/reviews/image1.jpg'],
    nullable: true,
  })
  @Column({ type: 'simple-array', nullable: true })
  images: string[] | null;
}
