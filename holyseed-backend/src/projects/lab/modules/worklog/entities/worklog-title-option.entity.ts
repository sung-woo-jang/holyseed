import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 근무 기록 "현장명" 팔레트 — 입력 시 자동 등록/갱신, 추천 목록 소스. 이름 수정/삭제는 팔레트에만 적용되고 과거 근무 기록의 title은 그대로 유지(동명이현장 가능성 때문에 소급 반영 안 함) */
@Entity('worklog_title_options', { schema: 'lab' })
@Unique(['name'])
export class WorklogTitleOption {
  @ApiProperty({ description: '고유 ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '현장명', example: '부평' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: '마지막 사용 시각' })
  @Column({ name: 'last_used_at', type: 'timestamp' })
  lastUsedAt: Date;

  @ApiProperty({ description: '사용 횟수', example: 1 })
  @Column({ default: 1 })
  count: number;
}
