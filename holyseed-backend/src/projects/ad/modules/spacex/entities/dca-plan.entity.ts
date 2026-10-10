import { Column, Entity } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { numeric } from '../../../common/numeric.transformer';

/** 종목별 모으기 계획 — 토스 '주식 모으기'로 매일 일정 금액을 사는 종목 하나당 한 줄 */
@Entity('dca_plans', { schema: 'ad' })
export class DcaPlan extends BaseEntity {
  @ApiProperty({ description: '종목', example: 'UPRO' })
  @Column({ length: 10, unique: true })
  symbol: string;

  @ApiProperty({ description: '화면에 보일 이름', example: 'UPRO' })
  @Column({ length: 30 })
  name: string;

  @ApiProperty({ description: '1회 매수 금액 ($) — 표시·예상용, 실제 체결 금액은 기록이 기준', example: 1 })
  @Column({ name: 'daily_amount', type: 'decimal', precision: 10, scale: 2, transformer: numeric })
  dailyAmount: number;

  @ApiProperty({ description: '모으기 시작일', example: '2026-10-12' })
  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @ApiPropertyOptional({ description: '모으기 종료일 — null이면 진행 중' })
  @Column({ name: 'closed_at', type: 'date', nullable: true })
  closedAt: string | null;

  @ApiProperty({ description: '화면 순서', example: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
