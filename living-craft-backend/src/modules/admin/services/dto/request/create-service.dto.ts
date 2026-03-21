import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';
import { ServiceScheduleInputDto } from '@modules/services/dto/request/service-schedule.dto';

export class ServiceRegionFeeDto {
  @ApiProperty({ description: '지역 ID (District ID)', example: 3 })
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

  @ApiProperty({ description: '출장비 (원)', example: 10000 })
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

export class AdminCreateServiceDto {
  @ApiProperty({ description: '서비스 제목', example: '인테리어 필름' })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.title),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.title, 100),
  })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: '서비스 설명',
    example: '고급 인테리어 필름 시공 서비스입니다.',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.description),
  })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({ description: 'TDS 아이콘 이름', example: 'ic_home_fill_24' })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.iconName),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.iconName, 100),
  })
  iconName: string;

  @ApiPropertyOptional({
    description: '아이콘 배경색 (HEX)',
    example: '#E3F2FD',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.iconBgColor),
  })
  @MaxLength(10, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.iconBgColor, 10),
  })
  iconBgColor?: string | null;

  @ApiPropertyOptional({ description: '아이콘 색상 (HEX)', example: '#424242' })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.iconColor),
  })
  @MaxLength(10, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.iconColor, 10),
  })
  iconColor?: string | null;

  @ApiProperty({ description: '작업 소요 시간', example: '하루 종일' })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.duration),
  })
  @MaxLength(50, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.duration, 50),
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
    description: '정렬 순서 (자동 계산됨, 생략 가능)',
    example: 1,
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
    description: '서비스 가능 지역 및 출장비',
    type: [ServiceRegionFeeDto],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('지역 목록'),
  })
  @ArrayMinSize(1, {
    message: ERROR_MESSAGES.VALIDATION.ARRAY_NOT_EMPTY('지역 목록'),
  })
  @ValidateNested({ each: true })
  @Type(() => ServiceRegionFeeDto)
  regions: ServiceRegionFeeDto[];

  @ApiPropertyOptional({
    description: '서비스 스케줄 설정',
    type: ServiceScheduleInputDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceScheduleInputDto)
  schedule?: ServiceScheduleInputDto;
}
