import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Service } from './service.entity';

/**
 * 스케줄 모드 Enum
 * - GLOBAL: 전역 설정 사용
 * - WEEKDAYS: 평일만 (월~금)
 * - WEEKENDS: 주말만 (토~일)
 * - EVERYDAY: 매일
 * - CUSTOM: 커스텀 요일 선택
 * - EVERYDAY_EXCEPT: 매일 (특정 요일 제외)
 */
export enum ScheduleMode {
  GLOBAL = 'global',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  EVERYDAY = 'everyday',
  CUSTOM = 'custom',
  EVERYDAY_EXCEPT = 'everyday_except',
}

@Entity('service_schedules')
@Index(['serviceId'], { unique: true })
export class ServiceSchedule extends BaseEntity {
  @ApiProperty({
    description: '서비스 ID (FK)',
    example: 1,
  })
  @Column({ name: 'service_id', unique: true })
  serviceId: number;

  @OneToOne(() => Service, (service) => service.schedule, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  // ===== 견적 스케줄 설정 =====

  @ApiProperty({
    description: '견적 스케줄 모드',
    enum: ScheduleMode,
    example: ScheduleMode.GLOBAL,
  })
  @Column({
    name: 'estimate_schedule_mode',
    type: 'enum',
    enum: ScheduleMode,
    default: ScheduleMode.GLOBAL,
  })
  estimateScheduleMode: ScheduleMode;

  @ApiPropertyOptional({
    description: '견적 가능 요일 (CUSTOM/EVERYDAY_EXCEPT 모드)',
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
  })
  @Column({
    name: 'estimate_available_days',
    type: 'simple-array',
    nullable: true,
  })
  estimateAvailableDays: string[] | null;

  @ApiPropertyOptional({
    description: '견적 시작 시간',
    example: '18:00',
  })
  @Column({ name: 'estimate_start_time', length: 10, nullable: true })
  estimateStartTime: string | null;

  @ApiPropertyOptional({
    description: '견적 종료 시간',
    example: '22:00',
  })
  @Column({ name: 'estimate_end_time', length: 10, nullable: true })
  estimateEndTime: string | null;

  @ApiPropertyOptional({
    description: '견적 슬롯 간격 (분)',
    example: 60,
  })
  @Column({ name: 'estimate_slot_duration', type: 'int', nullable: true })
  estimateSlotDuration: number | null;

  // ===== 시공 스케줄 설정 =====

  @ApiProperty({
    description: '시공 스케줄 모드',
    enum: ScheduleMode,
    example: ScheduleMode.GLOBAL,
  })
  @Column({
    name: 'construction_schedule_mode',
    type: 'enum',
    enum: ScheduleMode,
    default: ScheduleMode.GLOBAL,
  })
  constructionScheduleMode: ScheduleMode;

  @ApiPropertyOptional({
    description: '시공 가능 요일 (CUSTOM/EVERYDAY_EXCEPT 모드)',
    example: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  })
  @Column({
    name: 'construction_available_days',
    type: 'simple-array',
    nullable: true,
  })
  constructionAvailableDays: string[] | null;

  @ApiPropertyOptional({
    description: '시공 시작 시간',
    example: '09:00',
  })
  @Column({ name: 'construction_start_time', length: 10, nullable: true })
  constructionStartTime: string | null;

  @ApiPropertyOptional({
    description: '시공 종료 시간',
    example: '18:00',
  })
  @Column({ name: 'construction_end_time', length: 10, nullable: true })
  constructionEndTime: string | null;

  @ApiPropertyOptional({
    description: '시공 슬롯 간격 (분)',
    example: 60,
  })
  @Column({ name: 'construction_slot_duration', type: 'int', nullable: true })
  constructionSlotDuration: number | null;

  // ===== 예약 가능 기간 =====

  @ApiProperty({
    description: '예약 가능 기간 (개월)',
    example: 3,
  })
  @Column({ name: 'booking_period_months', type: 'int', default: 3 })
  bookingPeriodMonths: number;
}
