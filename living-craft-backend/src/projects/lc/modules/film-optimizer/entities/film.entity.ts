import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { CuttingProject } from './cutting-project.entity';

@Entity('films')
export class Film extends BaseEntity {
  @ApiProperty({
    description: '필름지 이름',
    example: '인테리어 필름 (일반)',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    description: '필름 폭 (mm)',
    example: 1220,
  })
  @Column({ type: 'int', default: 1220 })
  width: number;

  @ApiProperty({
    description: '필름 길이 (mm)',
    example: 60000,
  })
  @Column({ type: 'int', default: 60000 })
  length: number;

  @ApiPropertyOptional({
    description: '필름지 설명',
    example: '일반 인테리어용 필름지입니다.',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: '활성화 여부',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiPropertyOptional({
    description: '재단 프로젝트 목록',
    type: () => [CuttingProject],
  })
  @OneToMany(() => CuttingProject, (project) => project.film)
  cuttingProjects: CuttingProject[];
}
