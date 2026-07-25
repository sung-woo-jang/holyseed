import { Column, Entity, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

/** VR 엔진 실행/스킵/오류 이벤트 로그 (laofus LaofusEvent와 동일 구조) */
@Entity('vr_events', { schema: 'lab' })
export class VrEvent extends BaseEntity {
  @ApiProperty({ description: '레벨', example: 'info' })
  @Column({ length: 8 })
  level: string; // info | warn | error

  @ApiProperty({ description: '출처', example: 'engine' })
  @Column({ length: 16, default: 'engine' })
  source: string;

  @ApiPropertyOptional({ description: '엔진 실행 1회 단위 그룹 키 (수동 이벤트는 null)' })
  @Index()
  @Column({ name: 'run_id', type: 'varchar', length: 36, nullable: true })
  runId: string | null;

  @ApiProperty({ description: '메시지' })
  @Column({ type: 'text' })
  message: string;
}
