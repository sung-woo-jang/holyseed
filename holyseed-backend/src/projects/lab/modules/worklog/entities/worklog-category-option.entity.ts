import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { numeric } from '../../../common/numeric.transformer';

/** 근무 기록 "분류" 팔레트 — 사용자가 직접 추가 관리 (삭제는 미지원) */
@Entity('worklog_category_options', { schema: 'lab' })
@Unique(['name'])
export class WorklogCategoryOption {
  @ApiProperty({ description: '고유 ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '분류 이름', example: '인테리어' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '표시 순서 (오름차순)', example: 0 })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: '기본 일급여 (미설정 시 날짜 기준 자동)', example: 140000 })
  @Column({ name: 'default_daily_wage', type: 'int', nullable: true })
  defaultDailyWage: number | null;

  @ApiProperty({ description: '원천징수(3.3%) 기본 적용 여부', example: true })
  @Column({ name: 'default_withholding_applied', type: 'boolean', default: true })
  defaultWithholdingApplied: boolean;

  @ApiProperty({ description: '초과근무 임계시간 (이 시간을 넘으면 추가수당 계산)', example: 8 })
  @Column({
    name: 'overtime_threshold_hours',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 8,
    transformer: numeric,
  })
  overtimeThresholdHours: number;

  @ApiProperty({ description: '초과근무 가산율 (시급 대비)', example: 0.1 })
  @Column({
    name: 'overtime_extra_rate',
    type: 'decimal',
    precision: 4,
    scale: 3,
    default: 0.1,
    transformer: numeric,
  })
  overtimeExtraRate: number;

  @ApiPropertyOptional({ description: '기본 시작 시각', example: '08:00' })
  @Column({ name: 'default_start_time', length: 5, nullable: true })
  defaultStartTime: string | null;

  @ApiPropertyOptional({ description: '기본 종료 시각', example: '22:00' })
  @Column({ name: 'default_end_time', length: 5, nullable: true })
  defaultEndTime: string | null;

  @ApiPropertyOptional({ description: '기본 휴게시간 (시간, 미설정 시 1시간)', example: 1 })
  @Column({ name: 'default_break_hours', type: 'decimal', precision: 4, scale: 2, nullable: true, transformer: numeric })
  defaultBreakHours: number | null;

  @ApiPropertyOptional({ description: '기본 주소' })
  @Column({ name: 'default_address', length: 500, nullable: true })
  defaultAddress: string | null;
}
