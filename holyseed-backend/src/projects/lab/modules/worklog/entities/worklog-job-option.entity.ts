import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 근무 기록 "업무" 체크박스 팔레트 — 사용자가 직접 추가/삭제 관리 */
@Entity('worklog_job_options', { schema: 'lab' })
@Unique(['name'])
export class WorklogJobOption {
  @ApiProperty({ description: '고유 ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '업무 이름', example: '필름' })
  @Column({ length: 50 })
  name: string;
}
