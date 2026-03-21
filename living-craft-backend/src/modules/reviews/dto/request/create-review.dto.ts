import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES, FIELD_NAMES } from '@common/constants';

export class CreateReviewDto {
  @ApiProperty({
    description: '예약 ID',
    example: '1',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.reservationId),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.reservationId),
  })
  reservationId: string;

  @ApiProperty({
    description: '평점 (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER(FIELD_NAMES.rating),
    },
  )
  @Min(1, {
    message: ERROR_MESSAGES.VALIDATION.MIN(FIELD_NAMES.rating, 1),
  })
  @Max(5, {
    message: ERROR_MESSAGES.VALIDATION.MAX(FIELD_NAMES.rating, 5),
  })
  rating: number;

  @ApiProperty({
    description: '리뷰 내용',
    example: '친절하고 깔끔하게 시공해주셨습니다.',
  })
  @IsString({
    message: ERROR_MESSAGES.VALIDATION.IS_STRING(FIELD_NAMES.comment),
  })
  @IsNotEmpty({
    message: ERROR_MESSAGES.VALIDATION.IS_NOT_EMPTY(FIELD_NAMES.comment),
  })
  @MaxLength(2000, {
    message: ERROR_MESSAGES.VALIDATION.MAX_LENGTH(FIELD_NAMES.comment, 2000),
  })
  @Transform(({ value }) => value?.trim())
  comment: string;
}
