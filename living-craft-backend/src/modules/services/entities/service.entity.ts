import {
  Entity,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Icon } from '@modules/icons/entities/icon.entity';
import { ServiceRegion } from './service-region.entity';
import { ServiceSchedule } from './service-schedule.entity';
import { ServiceHoliday } from './service-holiday.entity';

@Entity('services')
export class Service extends BaseEntity {
  @ApiProperty({
    description: '서비스 제목',
    example: '인테리어 필름',
  })
  @Column({ length: 100 })
  title: string;

  @ApiProperty({
    description: '서비스 설명',
    example: '고급 인테리어 필름 시공 서비스입니다.',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: '아이콘 ID (icons 테이블 FK)',
    example: 1,
  })
  @Column({ name: 'icon_id' })
  iconId: number;

  @ApiPropertyOptional({
    description: '아이콘 정보',
    type: () => Icon,
  })
  @ManyToOne(() => Icon, (icon) => icon.services, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'icon_id' })
  icon: Icon;

  @ApiPropertyOptional({
    description: '아이콘 배경색 (HEX)',
    example: '#E3F2FD',
  })
  @Column({ name: 'icon_bg_color', length: 10, nullable: true })
  iconBgColor: string | null;

  @ApiPropertyOptional({
    description: '아이콘 색상 (HEX)',
    example: '#424242',
  })
  @Column({ name: 'icon_color', length: 10, nullable: true })
  iconColor: string | null;

  @ApiProperty({
    description: '작업 소요 시간',
    example: '하루 종일',
  })
  @Column({ length: 50 })
  duration: string;

  @ApiProperty({
    description: '시공 시간 선택 필요 여부 (false: 하루 종일, true: 시간 선택)',
    example: false,
  })
  @Column({ name: 'requires_time_selection', default: false })
  requiresTimeSelection: boolean;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({
    description: '서비스 가능 지역 목록',
    type: () => [ServiceRegion],
  })
  @OneToMany(() => ServiceRegion, (serviceRegion) => serviceRegion.service)
  serviceRegions: ServiceRegion[];

  @ApiPropertyOptional({
    description: '서비스 스케줄 설정',
    type: () => ServiceSchedule,
  })
  @OneToOne(() => ServiceSchedule, (schedule) => schedule.service, {
    cascade: true,
    nullable: true,
  })
  schedule: ServiceSchedule;

  @ApiPropertyOptional({
    description: '서비스별 휴무일 목록',
    type: () => [ServiceHoliday],
  })
  @OneToMany(() => ServiceHoliday, (holiday) => holiday.service)
  holidays: ServiceHoliday[];
}
