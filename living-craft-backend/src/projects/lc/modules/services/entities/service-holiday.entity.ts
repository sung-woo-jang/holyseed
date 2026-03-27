import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Service } from './service.entity';

/**
 * 서비스별 휴무일 엔티티
 * 전역 휴무일과 별도로 서비스별로 특정 날짜를 휴무로 지정할 수 있음
 */
@Entity('service_holidays')
@Index(['serviceId', 'date'], { unique: true })
export class ServiceHoliday extends BaseEntity {
  @ApiProperty({
    description: '서비스 ID (FK)',
    example: 1,
  })
  @Column({ name: 'service_id' })
  serviceId: number;

  @ManyToOne(() => Service, (service) => service.holidays, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty({
    description: '휴무일 날짜',
    example: '2024-01-15',
  })
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({
    description: '휴무 사유',
    example: '설날 연휴',
  })
  @Column({ length: 200 })
  reason: string;
}
