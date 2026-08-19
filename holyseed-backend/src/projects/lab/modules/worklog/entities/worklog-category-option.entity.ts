import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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
}
