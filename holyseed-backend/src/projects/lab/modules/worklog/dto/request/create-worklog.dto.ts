import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PayStatus, WorklogPhoto } from '../../entities';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateWorklogDto {
  @ApiProperty({ description: '현장명', example: '송도 / 학익' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ description: '근무일', example: '2026-06-22' })
  @IsDateString({}, { message: '근무일은 YYYY-MM-DD 형식이어야 합니다.' })
  workDate: string;

  @ApiPropertyOptional({ description: '시작 시각 (HH:mm)', example: '08:00' })
  @IsOptional()
  @Matches(TIME_PATTERN, { message: '시작 시각은 HH:mm 형식이어야 합니다.' })
  startTime?: string;

  @ApiPropertyOptional({ description: '종료 시각 (HH:mm)', example: '22:00' })
  @IsOptional()
  @Matches(TIME_PATTERN, { message: '종료 시각은 HH:mm 형식이어야 합니다.' })
  endTime?: string;

  @ApiPropertyOptional({ description: '휴게시간 (기본 1)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakHours?: number;

  @ApiPropertyOptional({ description: '업무', example: ['필름', '도배'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobs?: string[];

  @ApiPropertyOptional({ description: '수령여부', enum: PayStatus, default: PayStatus.EXPECTED })
  @IsOptional()
  @IsEnum(PayStatus)
  payStatus?: PayStatus;

  @ApiPropertyOptional({ description: '분류 (사용자가 직접 추가/관리)', example: '인테리어', default: '인테리어' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: '일급여 (미지정 시 날짜 기준 자동)', example: 140000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyWage?: number;

  @ApiPropertyOptional({ description: '수동 오버라이드 금액 (실수령 우선)', example: null })
  @IsOptional()
  @IsInt()
  amountOverride?: number | null;

  @ApiPropertyOptional({ description: '원천징수(3.3%) 적용 여부 (미지정 시 분류 기본값)', example: true })
  @IsOptional()
  @IsBoolean()
  withholdingApplied?: boolean;

  @ApiPropertyOptional({ description: '사정으로 일당의 절반만 지급받는 경우 true', default: false })
  @IsOptional()
  @IsBoolean()
  halfPay?: boolean;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: '근무 사진', type: [WorklogPhoto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorklogPhoto)
  photos?: WorklogPhoto[];
}
