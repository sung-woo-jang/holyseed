import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('schedules', { schema: 'lab' })
export class Schedule extends BaseEntity {
  @ApiProperty({ description: '일정 제목', example: '결혼기념일' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '시작 일시', example: '2026-07-20T00:00:00+09:00' })
  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @ApiPropertyOptional({ description: '종료 일시 (기간 일정)', example: null })
  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @ApiProperty({ description: '종일 일정 여부', example: true })
  @Column({ name: 'all_day', default: true })
  allDay: boolean;

  @ApiProperty({ description: '태그', example: ['기념일'] })
  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  @ApiPropertyOptional({ description: '관련 링크' })
  @Column({ length: 1000, nullable: true })
  link: string | null;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  memo: string | null;
}
