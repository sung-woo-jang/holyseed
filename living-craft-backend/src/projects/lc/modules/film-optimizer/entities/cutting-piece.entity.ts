import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { CuttingProject } from './cutting-project.entity';

@Entity('cutting_pieces')
export class CuttingPiece extends BaseEntity {
  @ApiProperty({
    description: '프로젝트 ID',
    example: 1,
  })
  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => CuttingProject, (project) => project.pieces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: CuttingProject;

  @ApiProperty({
    description: '조각 폭 (mm)',
    example: 500,
  })
  @Column({ type: 'int' })
  width: number;

  @ApiProperty({
    description: '조각 높이 (mm)',
    example: 400,
  })
  @Column({ type: 'int' })
  height: number;

  @ApiProperty({
    description: '수량',
    example: 1,
  })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiPropertyOptional({
    description: '라벨 (예: 거실 창문 1)',
    example: '거실 창문 1',
  })
  @Column({ length: 100, nullable: true })
  label: string;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiProperty({
    description: '재단 완료 여부',
    example: false,
  })
  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료된 조각의 고정 위치 (패킹 결과에서의 위치)',
    example: { x: 0, y: 0, width: 500, height: 400, rotated: false },
  })
  @Column({ name: 'fixed_position', type: 'jsonb', nullable: true })
  fixedPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
  } | null;
}
