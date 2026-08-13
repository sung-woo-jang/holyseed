import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 근무 기록 "업무" 체크박스 팔레트 — 사용자가 직접 추가/삭제 관리, 분류별로 옵션이 다름 */
@Entity('worklog_job_options', { schema: 'lab' })
@Unique(['name', 'category'])
export class WorklogJobOption {
  @ApiProperty({ description: '고유 ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '업무 이름', example: '필름' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '소속 분류', example: '인테리어' })
  @Column({ length: 50, default: '인테리어' })
  category: string;
}
