import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

/**
 * 서비스 생성 DTO
 */
export class CreateServiceDto {
  @ApiProperty({
    description: '서비스명',
    example: '인테리어 필름',
    maxLength: 100,
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.title),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.title, 100),
  })
  title: string;

  @ApiProperty({
    description: '서비스 설명',
    example: '고급 인테리어 필름 시공 서비스입니다.',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.description),
  })
  description: string;

  @ApiProperty({
    description: '아이콘 ID (icons 테이블 FK)',
    example: 1,
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('아이콘 ID'),
    },
  )
  @Min(1, {
    message: ERROR_MESSAGES.VALIDATION.MIN('아이콘 ID', 1),
  })
  iconId: number;

  @ApiProperty({
    description: '아이콘 배경색 (HEX 색상 코드)',
    example: '#E3F2FD',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.iconBgColor),
  })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_COLOR_FORMAT,
  })
  iconBgColor: string;

  @ApiProperty({
    description: '아이콘 색상 (HEX 색상 코드)',
    example: '#424242',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.iconColor),
  })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_COLOR_FORMAT,
  })
  iconColor: string;

  @ApiProperty({
    description: '작업 소요 시간',
    example: '하루 종일',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.duration),
  })
  duration: string;

  @ApiProperty({
    description: '시공 시간 선택 필요 여부',
    example: false,
  })
  @IsBoolean({
    message: ERROR_MESSAGES.VALIDATION.IS_BOOLEAN(
      FIELD_NAMES.requiresTimeSelection,
    ),
  })
  requiresTimeSelection: boolean;

  @ApiPropertyOptional({
    description: '정렬 순서 (낮을수록 먼저 표시)',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('정렬 순서'),
    },
  )
  @Min(0, {
    message: ERROR_MESSAGES.VALIDATION.MIN('정렬 순서', 0),
  })
  sortOrder?: number;
}
