import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class CreateReservationDto {
  @ApiProperty({
    description: '서비스 ID',
    example: '1',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.serviceId),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.serviceId),
  })
  serviceId: string;

  @ApiProperty({
    description: '견적 날짜 (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.estimateDate),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.estimateDate),
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: ERROR_MESSAGES.VALIDATION.DATE_FORMAT(FIELD_NAMES.estimateDate),
  })
  estimateDate: string;

  @ApiProperty({
    description: '견적 시간 (HH:mm)',
    example: '18:00',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.estimateTime),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.estimateTime),
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: ERROR_MESSAGES.VALIDATION.TIME_FORMAT(FIELD_NAMES.estimateTime),
  })
  estimateTime: string;

  @ApiProperty({
    description: '도로명 주소',
    example: '서울특별시 강남구 테헤란로 123',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.address),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.address),
  })
  @MaxLength(500, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.address, 500),
  })
  @Transform(({ value }) => value?.trim())
  address: string;

  @ApiProperty({
    description: '상세 주소',
    example: '2층 201호',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.detailAddress),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.detailAddress),
  })
  @MaxLength(200, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(
      FIELD_NAMES.detailAddress,
      200,
    ),
  })
  @Transform(({ value }) => value?.trim())
  detailAddress: string;

  @ApiProperty({
    description: '고객 이름',
    example: '홍길동',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.customerName),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.customerName),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(
      FIELD_NAMES.customerName,
      100,
    ),
  })
  @Transform(({ value }) => value?.trim())
  customerName: string;

  @ApiProperty({
    description: '고객 전화번호',
    example: '010-1234-5678',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.customerPhone),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.customerPhone),
  })
  @MaxLength(20, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(
      FIELD_NAMES.customerPhone,
      20,
    ),
  })
  customerPhone: string;

  @ApiPropertyOptional({
    description: '메모',
    example: '주차 공간 없음',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.memo),
  })
  @Transform(({ value }) => value?.trim())
  memo?: string;
}
