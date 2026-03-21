import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsOptional,
  MaxLength,
  Min,
  ArrayMinSize,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';
import { ServiceScheduleInputDto } from './service-schedule.dto';

/**
 * 서비스 지역 입력 DTO
 */
export class ServiceRegionInputDto {
  @ApiProperty({
    description: '지역 ID (District ID)',
    example: 1,
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.districtId),
    },
  )
  @Min(1, {
    message: ERROR_MESSAGES.VALIDATION.MIN(FIELD_NAMES.districtId, 1),
  })
  districtId: number;

  @ApiProperty({
    description: '출장비 (원)',
    example: 10000,
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('출장비'),
    },
  )
  @Min(0, {
    message: ERROR_MESSAGES.VALIDATION.MIN('출장비', 0),
  })
  estimateFee: number;
}

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

  @ApiProperty({
    description: '서비스 가능 지역 목록',
    type: [ServiceRegionInputDto],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('지역 목록'),
  })
  @ArrayMinSize(1, {
    message: ERROR_MESSAGES.VALIDATION.ARRAY_NOT_EMPTY('지역 목록'),
  })
  @ValidateNested({ each: true })
  @Type(() => ServiceRegionInputDto)
  regions: ServiceRegionInputDto[];

  @ApiPropertyOptional({
    description: '서비스 스케줄 설정 (미입력 시 전역 설정 사용)',
    type: ServiceScheduleInputDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceScheduleInputDto)
  schedule?: ServiceScheduleInputDto;
}
