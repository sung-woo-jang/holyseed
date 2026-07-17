import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateScheduleDto {
  @ApiProperty({ description: '일정 제목', example: '결혼기념일' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ description: '시작 일시 (ISO 8601)', example: '2026-07-20T00:00:00+09:00' })
  @IsDateString()
  startAt: string;

  @ApiPropertyOptional({ description: '종료 일시 (기간 일정)' })
  @IsOptional()
  @IsDateString()
  endAt?: string | null;

  @ApiPropertyOptional({ description: '종일 일정 여부', default: true })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({ description: '태그', example: ['기념일'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '관련 링크' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  link?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
