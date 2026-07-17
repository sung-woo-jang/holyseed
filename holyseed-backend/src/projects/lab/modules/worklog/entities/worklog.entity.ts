import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

export enum PayStatus {
  RECEIVED = 'RECEIVED',
  EXPECTED = 'EXPECTED',
  UNPAID = 'UNPAID',
  DAYOFF = 'DAYOFF',
}

@Entity('worklogs', { schema: 'lab' })
export class Worklog extends BaseEntity {
  @ApiProperty({ description: '현장명 (여러 곳이면 / 구분)', example: '송도 / 학익' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '근무일', example: '2026-06-22' })
  @Column({ name: 'work_date', type: 'date' })
  workDate: string;

  @ApiPropertyOptional({ description: '시작 시각', example: '08:00' })
  @Column({ name: 'start_time', length: 5, nullable: true })
  startTime: string | null;

  @ApiPropertyOptional({ description: '종료 시각', example: '22:00' })
  @Column({ name: 'end_time', length: 5, nullable: true })
  endTime: string | null;

  @ApiProperty({ description: '휴게시간 (시간)', example: 1 })
  @Column({ name: 'break_hours', type: 'decimal', precision: 4, scale: 2, default: 1, transformer: numeric })
  breakHours: number;

  @ApiProperty({ description: '업무 (도배/필름/퍼티/철거)', example: ['필름'] })
  @Column({ type: 'simple-array', default: '' })
  jobs: string[];

  @ApiProperty({ description: '수령여부', enum: PayStatus })
  @Column({ name: 'pay_status', type: 'enum', enum: PayStatus, enumName: 'lab_pay_status', default: PayStatus.EXPECTED })
  payStatus: PayStatus;

  @ApiProperty({ description: '일급여 (원)', example: 140000 })
  @Column({ name: 'daily_wage', type: 'int' })
  dailyWage: number;

  @ApiProperty({ description: '계산 금액 (원)', example: 236250 })
  @Column({ type: 'int', default: 0 })
  amount: number;

  @ApiPropertyOptional({ description: '수동 오버라이드 금액 (실수령 우선 원칙)', example: null })
  @Column({ name: 'amount_override', type: 'int', nullable: true })
  amountOverride: number | null;

  @ApiPropertyOptional({ description: '주소 (/ 구분)' })
  @Column({ length: 500, nullable: true })
  address: string | null;

  @ApiPropertyOptional({ description: '메모' })
  @Column({ type: 'text', nullable: true })
  memo: string | null;
}
