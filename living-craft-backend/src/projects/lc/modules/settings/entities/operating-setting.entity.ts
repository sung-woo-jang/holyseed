import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

export enum OperatingType {
  ESTIMATE = 'estimate',
  CONSTRUCTION = 'construction',
}

@Entity('operating_settings')
export class OperatingSetting extends BaseEntity {
  @ApiProperty({
    description: '운영 타입 (견적/시공)',
    enum: OperatingType,
    example: OperatingType.ESTIMATE,
  })
  @Column({ type: 'enum', enum: OperatingType, unique: true })
  type: OperatingType;

  @ApiProperty({
    description: '가능한 요일 목록',
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
  })
  @Column({ name: 'available_days', type: 'simple-array' })
  availableDays: string[];

  @ApiProperty({
    description: '시작 시간',
    example: '18:00',
  })
  @Column({ name: 'start_time', length: 10 })
  startTime: string;

  @ApiProperty({
    description: '종료 시간',
    example: '22:00',
  })
  @Column({ name: 'end_time', length: 10 })
  endTime: string;

  @ApiProperty({
    description: '슬롯 간격 (분)',
    example: 60,
  })
  @Column({ name: 'slot_duration', type: 'int', default: 60 })
  slotDuration: number;
}
