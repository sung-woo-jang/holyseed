import { Column, Entity } from 'typeorm';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

/** 스페이스X 기록 전체를 대표하는 싱글턴 상태 — 지금은 종료 여부 하나만 관리 */
@Entity('spacex_state', { schema: 'lab' })
export class SpacexState extends BaseEntity {
  @ApiPropertyOptional({ description: '투자 종료일 — null이면 진행 중' })
  @Column({ name: 'closed_at', type: 'date', nullable: true })
  closedAt: string | null;
}
