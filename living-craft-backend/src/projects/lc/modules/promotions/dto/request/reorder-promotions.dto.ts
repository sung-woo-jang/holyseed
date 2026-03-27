import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ERROR_MESSAGES } from '@common/constants';

class PromotionOrderItem {
  @ApiProperty({
    description: '프로모션 ID',
    example: 1,
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('프로모션 ID'),
    },
  )
  id: number;

  @ApiProperty({
    description: '정렬 순서',
    example: 1,
  })
  @IsNumber(
    {},
    {
      message: ERROR_MESSAGES.VALIDATION.IS_NUMBER('정렬 순서'),
    },
  )
  sortOrder: number;
}

export class ReorderPromotionsDto {
  @ApiProperty({
    description: '프로모션 정렬 순서 목록',
    type: [PromotionOrderItem],
    example: [
      { id: 1, sortOrder: 1 },
      { id: 2, sortOrder: 2 },
    ],
  })
  @IsArray({
    message: ERROR_MESSAGES.VALIDATION.IS_ARRAY('정렬 순서 목록'),
  })
  @ValidateNested({ each: true })
  @Type(() => PromotionOrderItem)
  items: PromotionOrderItem[];
}
