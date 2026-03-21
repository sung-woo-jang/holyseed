import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Service } from './service.entity';
import { District } from '@modules/admin/districts/entities/district.entity';

@Entity('service_regions')
@Unique(['serviceId', 'districtId'])
export class ServiceRegion extends BaseEntity {
  @ApiProperty({
    description: '서비스',
    type: () => Service,
  })
  @ManyToOne(() => Service, (service) => service.serviceRegions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty({
    description: '서비스 ID',
    example: 1,
  })
  @Column({ name: 'service_id' })
  serviceId: number;

  @ApiProperty({
    description: '지역 (District)',
    type: () => District,
  })
  @ManyToOne(() => District, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district: District;

  @ApiProperty({
    description: '지역 ID',
    example: 1,
  })
  @Column({ name: 'district_id' })
  districtId: number;

  @ApiProperty({
    description: '출장비 (원)',
    example: 10000,
  })
  @Column({
    name: 'estimate_fee',
    type: 'decimal',
    precision: 10,
    scale: 0,
    default: 0,
  })
  estimateFee: number;
}
