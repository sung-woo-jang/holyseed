import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class CreatePortfolioDto {
  @ApiProperty({ description: '카테고리', example: '인테리어필름' })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.category),
  })
  @MaxLength(50, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.category, 50),
  })
  @Transform(({ value }) => value?.trim())
  category: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '강남 카페 인테리어',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('프로젝트명'),
  })
  @MaxLength(200, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH('프로젝트명', 200),
  })
  @Transform(({ value }) => value?.trim())
  projectName: string;

  @ApiPropertyOptional({ description: '고객사', example: '카페 이름' })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('고객사'),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH('고객사', 100),
  })
  @Transform(({ value }) => value?.trim())
  client?: string;

  @ApiProperty({ description: '작업 기간', example: '2일' })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.duration),
  })
  @MaxLength(50, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.duration, 50),
  })
  duration: string;

  @ApiProperty({
    description: '간단 설명',
    example: '모던한 분위기의 카페 인테리어 필름 시공',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.description),
  })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    description: '상세 설명',
    example:
      '모던한 분위기의 카페 인테리어 필름 시공 작업입니다. 대리석 패턴의 필름을 적용하여 고급스러운 느낌을 연출했습니다.',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('상세 설명'),
  })
  @Transform(({ value }) => value?.trim())
  detailedDescription: string;

  @ApiPropertyOptional({
    description: '태그 배열',
    example: ['카페', '모던', '인테리어필름'],
  })
  @IsOptional()
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('태그'),
  })
  @IsString({
    each: true,
    message: ERROR_MESSAGES.VALIDATION.ARRAY_ITEM_STRING('태그'),
  })
  tags?: string[];

  @ApiProperty({ description: '관련 서비스 ID', example: 1 })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('관련 서비스 ID'),
    },
  )
  relatedServiceId: number;
}
