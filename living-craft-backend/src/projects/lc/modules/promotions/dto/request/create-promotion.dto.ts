import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES } from '@common/constants';
import { PromotionLinkType } from '../../entities/promotion.entity';

export class CreatePromotionDto {
  @ApiProperty({
    description: '프로모션 제목',
    example: '친구 초대하고 함께 쿠폰 받기',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('프로모션 제목'),
  })
  @MaxLength(100, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH('프로모션 제목', 100),
  })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional({
    description: '프로모션 부제목',
    example: '이용하는 친구 초대하고 할인 쿠폰 받기!',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('프로모션 부제목'),
  })
  @MaxLength(200, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH('프로모션 부제목', 200),
  })
  @Transform(({ value }) => value?.trim())
  subtitle?: string;

  @ApiProperty({
    description: '아이콘 ID',
    example: 1,
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('아이콘 ID'),
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('아이콘 ID'),
    },
  )
  iconId: number;

  @ApiProperty({
    description: '아이콘 배경색 (HEX)',
    example: '#E3F2FD',
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('아이콘 배경색'),
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('아이콘 배경색'),
  })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_COLOR_FORMAT,
  })
  iconBgColor: string;

  @ApiProperty({
    description: '아이콘 색상 (HEX)',
    example: '#1976D2',
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY('아이콘 색상'),
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('아이콘 색상'),
  })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_COLOR_FORMAT,
  })
  iconColor: string;

  @ApiPropertyOptional({
    description: '링크 URL',
    example: 'https://example.com/promotion',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('링크 URL'),
  })
  @Transform(({ value }) => value?.trim())
  linkUrl?: string;

  @ApiPropertyOptional({
    description: '링크 타입 (external: 외부 브라우저, internal: 앱 내 이동)',
    enum: PromotionLinkType,
    example: PromotionLinkType.EXTERNAL,
  })
  @IsOptional()
  @IsEnum(PromotionLinkType, {
    message: ERROR_MESSAGES.VALIDATION.INVALID_ENUM(
      '링크 타입',
      Object.values(PromotionLinkType).join(', '),
    ),
  })
  linkType?: PromotionLinkType;

  @ApiPropertyOptional({
    description: '게시 시작일 (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('게시 시작일'),
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: ERROR_MESSAGES.VALIDATION.DATE_FORMAT('게시 시작일'),
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: '게시 종료일 (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING('게시 종료일'),
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: ERROR_MESSAGES.VALIDATION.DATE_FORMAT('게시 종료일'),
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: '활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean({
    message: ERROR_MESSAGES.VALIDATION.IS_BOOLEAN('활성화 여부'),
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '정렬 순서',
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
}
