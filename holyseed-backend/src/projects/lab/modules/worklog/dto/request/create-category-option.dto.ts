import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryOptionDto {
  @ApiProperty({ description: '분류 이름', example: '청소' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ description: '기본 일급여 (미설정 시 날짜 기준 자동)', example: 140000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultDailyWage?: number | null;

  @ApiPropertyOptional({ description: '원천징수(3.3%) 기본 적용 여부', default: true })
  @IsOptional()
  @IsBoolean()
  defaultWithholdingApplied?: boolean;

  @ApiPropertyOptional({ description: '초과근무 임계시간', default: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeThresholdHours?: number;

  @ApiPropertyOptional({ description: '초과근무 가산율', default: 0.1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  overtimeExtraRate?: number;

  @ApiPropertyOptional({ description: '기본 시작 시각', example: '08:00' })
  @IsOptional()
  @IsString()
  defaultStartTime?: string | null;

  @ApiPropertyOptional({ description: '기본 종료 시각', example: '22:00' })
  @IsOptional()
  @IsString()
  defaultEndTime?: string | null;

  @ApiPropertyOptional({ description: '기본 휴게시간 (시간, 미설정 시 1시간)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultBreakHours?: number | null;

  @ApiPropertyOptional({ description: '기본 주소' })
  @IsOptional()
  @IsString()
  defaultAddress?: string | null;
}
