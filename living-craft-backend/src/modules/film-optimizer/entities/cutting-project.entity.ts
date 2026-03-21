import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Film } from './film.entity';
import { CuttingPiece } from './cutting-piece.entity';

/**
 * 배치된 조각 정보
 */
export interface PackedRect {
  pieceId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  label: string;
  cutOrder: number;
}

/**
 * 배치된 빈 정보
 */
export interface PackedBin {
  width: number;
  height: number;
  rects: PackedRect[];
}

/**
 * 패킹 결과 JSON 구조
 */
export interface PackingResultJson {
  bins: PackedBin[];
  usedLength: number;
  totalUsedArea: number;
  totalPieceArea: number;
  totalWasteArea: number;
  wastePercentage: number;
}

@Entity('cutting_projects')
export class CuttingProject extends BaseEntity {
  @ApiProperty({
    description: '프로젝트 이름',
    example: '거실 필름 시공',
  })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({
    description: '필름지 ID',
    example: 1,
  })
  @Column({ name: 'film_id' })
  filmId: number;

  @ApiPropertyOptional({
    description: '필름지 정보',
    type: () => Film,
  })
  @ManyToOne(() => Film, (film) => film.cuttingProjects, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'film_id' })
  film: Film;

  @ApiProperty({
    description: '회전 허용 여부',
    example: true,
  })
  @Column({ name: 'allow_rotation', default: true })
  allowRotation: boolean;

  @ApiPropertyOptional({
    description: '손실율 (%)',
    example: 12.5,
  })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'waste_percentage',
    nullable: true,
  })
  wastePercentage: number;

  @ApiPropertyOptional({
    description: '사용된 필름 길이 (mm)',
    example: 2450,
  })
  @Column({ type: 'int', name: 'used_length', nullable: true })
  usedLength: number;

  @ApiPropertyOptional({
    description: '패킹 결과 JSON',
  })
  @Column({ type: 'jsonb', name: 'packing_result', nullable: true })
  packingResult: PackingResultJson;

  @ApiPropertyOptional({
    description: '재단 조각 목록',
    type: () => [CuttingPiece],
  })
  @OneToMany(() => CuttingPiece, (piece) => piece.project, {
    cascade: true,
  })
  pieces: CuttingPiece[];
}
