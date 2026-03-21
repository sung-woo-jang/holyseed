import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('holidays')
export class Holiday extends BaseEntity {
  @ApiProperty({
    description: '휴무일 (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @Column({ type: 'date', unique: true })
  date: Date;

  @ApiProperty({
    description: '휴무 사유',
    example: '신정',
  })
  @Column({ length: 200 })
  reason: string;
}
